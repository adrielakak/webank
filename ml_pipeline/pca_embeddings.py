import pyarrow.parquet as pq
import pyarrow as pa
import pandas as pd
import numpy as np
from sklearn.decomposition import IncrementalPCA
import time
import os

def process_pca():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'ml_pipeline' else script_dir
    parquet_path = os.path.join(project_root, 'teacher data', 'China_Ashares_FC_and_NewsEmbedding.parquet')
    output_path = os.path.join(project_root, 'teacher data', 'embeddings_pca.parquet')
    
    if not os.path.exists(parquet_path):
        print(f"Error: {parquet_path} not found.")
        return
        
    n_components = 30
    ipca = IncrementalPCA(n_components=n_components)
    batch_size = 20000
    
    parquet_file = pq.ParquetFile(parquet_path)
    
    print("Pass 1: Fitting IncrementalPCA on training data only (date < 2023)...")
    start_time = time.time()
    
    dim = None
    total_train_rows = 0
    
    for batch_idx, batch in enumerate(parquet_file.iter_batches(batch_size=batch_size, columns=['date', 'news_text_merged_embedding'])):
        dates = batch['date'].to_pylist()
        batch_list = batch['news_text_merged_embedding'].to_pylist()
        
        # FILTER: Strict temporal cut (< 2023) to eliminate look-ahead bias
        train_indices = [i for i, d in enumerate(dates) if str(d)[:4] < '2023']
        if not train_indices:
            continue
            
        if dim is None:
            valid_lens = [len(batch_list[i]) for i in train_indices if batch_list[i] is not None and len(batch_list[i]) > 0]
            if valid_lens:
                dim = valid_lens[0]
                
        if dim is None:
            continue
            
        X_train_chunk = []
        for i in train_indices:
            x = batch_list[i]
            if x is None or len(x) != dim:
                X_train_chunk.append(np.zeros(dim))
            else:
                X_train_chunk.append(x)
        
        # IncrementalPCA requires at least n_components samples
        if len(X_train_chunk) < n_components:
            continue
            
        X_train_chunk = np.array(X_train_chunk)
        ipca.partial_fit(X_train_chunk)
        total_train_rows += len(X_train_chunk)
        
        print(f"  Fitted batch {batch_idx + 1}, processed {total_train_rows} training rows (< 2023)...")
        
    print(f"Fitting completed in {time.time() - start_time:.2f}s on {total_train_rows} training rows.")
    
    print("Pass 2: Transforming and saving to PyArrow table...")
    start_time = time.time()
    
    columns_to_read = ['stkcd', 'date', 'news_text_merged_embedding']
    
    writer = None
    
    total_transformed = 0
    for batch_idx, batch in enumerate(parquet_file.iter_batches(batch_size=batch_size, columns=columns_to_read)):
        stkcd = batch['stkcd'].to_pylist()
        date = batch['date'].to_pylist()
        batch_list = batch['news_text_merged_embedding'].to_pylist()
        
        X_chunk = []
        for x in batch_list:
            if x is None or len(x) != dim:
                X_chunk.append(np.zeros(dim))
            else:
                X_chunk.append(x)
                
        X_chunk = np.array(X_chunk)
        X_pca = ipca.transform(X_chunk)
        
        df_chunk = pd.DataFrame({
            'stkcd': stkcd,
            'date': date
        })
        
        for i in range(n_components):
            df_chunk[f'news_pca_{i}'] = X_pca[:, i]
            
        table = pa.Table.from_pandas(df_chunk)
        
        if writer is None:
            writer = pq.ParquetWriter(output_path, table.schema)
            
        writer.write_table(table)
        total_transformed += len(stkcd)
        print(f"  Transformed batch {batch_idx + 1}, processed {total_transformed} rows...")
        
    if writer:
        writer.close()
        
    print(f"Transforming and saving completed in {time.time() - start_time:.2f}s")
    print(f"Saved PCA embeddings to {output_path}")

if __name__ == "__main__":
    process_pca()
