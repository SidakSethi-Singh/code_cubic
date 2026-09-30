"""device/app/embed/sparse.py — BM25 sparse embeddings.
Uses simple token hashing as baseline. Can be swapped for Edge's built-in BM25."""

import re
from typing import List, Tuple, Dict
from collections import Counter

class SparseEmbedder:
    def __init__(self, vocab_size: int = 30000):
        self.vocab_size = vocab_size
        # A simple list of common English stopwords
        self.stopwords = {
            "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
            "which", "this", "that", "these", "those", "then", "just", "so", "than",
            "such", "both", "through", "about", "for", "is", "of", "while", "during",
            "to", "in", "on", "at", "by", "with", "from", "up", "down", "in", "out",
            "it", "its", "you", "your", "they", "their", "we", "our", "he", "his", "she", "her"
        }
        self.k1 = 1.2
        
    def embed(self, texts: List[str]) -> List[Tuple[List[int], List[float]]]:
        return [self.embed_one(t) for t in texts]
        
    def embed_one(self, text: str) -> Tuple[List[int], List[float]]:
        # Tokenization: lowercase, split on non-alphanumeric
        text = text.lower()
        tokens = re.findall(r'\b\w+\b', text)
        
        # Remove stopwords
        filtered_tokens = [t for t in tokens if t not in self.stopwords and len(t) > 1]
        
        if not filtered_tokens:
            return ([], [])
            
        # Count term frequencies
        tf_counts = Counter(filtered_tokens)
        
        indices = []
        values = []
        
        for token, count in tf_counts.items():
            # Hash to vocab_size deterministically
            # Built-in hash() is salted per Python run, so we use a simple string hash
            h = 0
            for char in token:
                h = (31 * h + ord(char)) % self.vocab_size
                
            indices.append(h)
            
            # BM25-like TF saturation
            # TF = count / (count + 1.2)
            tf = count / (count + self.k1)
            # IDF = 1.0
            weight = tf * 1.0
            
            values.append(weight)
            
        # Sort by index for sparse vectors
        sorted_items = sorted(zip(indices, values))
        sorted_indices = [item[0] for item in sorted_items]
        sorted_values = [item[1] for item in sorted_items]
            
        return sorted_indices, sorted_values
