#!/bin/bash

###########################################################################
# To use:
# ./run_vale.sh docs/getting_started/python/index.md
# Execute the script with a path to the markdown file as an argument.
###########################################################################

# Check if an argument is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_markdown_file>"
    exit 1
fi

# Assign the argument to a variable
MARKDOWN_FILE="$1"
# Define the temporary output file path
TEMP_FILE="${MARKDOWN_FILE%.md}_temp.md"

# Run the Python script to preprocess the file
python remove_capitalized.py "$MARKDOWN_FILE" "$TEMP_FILE"

# Check if the Python script executed successfully
if [ $? -ne 0 ]; then
    echo "Preprocessing failed."
    exit 1
fi

# Run Vale on the temporary file
vale --config=.vale.ini "$TEMP_FILE"

# Remove the temporary file after running Vale
rm "$TEMP_FILE"


