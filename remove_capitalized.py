import re
import sys

def remove_capitalized_words(input_file_path, output_file_path):
    with open(input_file_path, 'r') as file:
        text = file.read()
    # Regex to find words that start with a capital letter
    text = re.sub(r'\b[A-Z][a-z]*\b', '', text)
    with open(output_file_path, 'w') as file:
        file.write(text)

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    remove_capitalized_words(input_path, output_path)
