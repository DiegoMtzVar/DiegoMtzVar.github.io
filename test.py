import os

def list_glb_files(directory):
    return [f for f in os.listdir(directory) if f.endswith('.glb')]

glb_files = list_glb_files(os.path.join(os.path.dirname(__file__), 'public/assets'))
print(glb_files)