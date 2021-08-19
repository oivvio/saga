from jsonschema import validate
from jsonschema import  Draft7Validator
from json import load

with open('schema.json') as file:
    schema = load(file)

with open('./data/stations/schema-test.json') as file:
    code_to_check = load(file)

# Only show errors
validator = Draft7Validator(schema)
print(list(validator.iter_errors(code_to_check)))

# Run all
# validate(code_to_check, schema=schema)
