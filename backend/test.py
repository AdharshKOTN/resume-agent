import faiss
import numpy as np

# Create simple data
d = 128
xb = np.random.random((1000, d)).astype('float32')
xq = np.random.random((10, d)).astype('float32')

# Transfer to GPU
res = faiss.StandardGpuResources()
index_flat = faiss.IndexFlatL2(d)
gpu_index = faiss.index_cpu_to_gpu(res, 0, index_flat)

gpu_index.add(xb)
D, I = gpu_index.search(xq, 5)
print("Top 5 nearest neighbor indices:", I)
