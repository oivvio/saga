from os import DirEntry
from jsonschema import validate
from jsonschema import  Draft7Validator
from json import load

import os

directory = "./data/stations"

with open('./schemas/schema.json') as file:
    schema = load(file)

with open(directory + "/schema-test.json") as f:
    code_to_check = load(f)    

# # Run all files in directory
# for file in os.scandir(directory):
#     if file.path.endswith(".json"):
#         with open(file.path) as f:
#             code_to_check = load(f)    

#         validator = Draft7Validator(schema)
#         print(list(validator.iter_errors(code_to_check)), "\n")     


# Only show errors
validator = Draft7Validator(schema)
print(list(validator.iter_errors(code_to_check)), "\n")


# Run all
# validate(code_to_check, schema=schema)
