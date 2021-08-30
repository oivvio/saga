import os
import sys
from invoke import task
from pathlib import Path

from jsonschema import Draft7Validator
from json import load


def preflight_checklist():
    """ Stuff we want to check before running our tasks """

    # Check that we are in the right folder
    if not os.path.exists("tasks.py"):
        print("Please run tasks from the root project folder")
        exit()


def validate_station_file(filename):
    """Validate a given file against our schema a return a list of errors"""
    with open("./schemas/schema.json") as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    validator = Draft7Validator(schema)

    errors = [e for e in validator.iter_errors(json_to_check)]
    return errors


def output_validation_errors(errors, filename):
    """ Output validation errors and filename for human consumption """
    if errors:
        print("=" * 100)
        print(filename)
    for error in errors:
        print("-" * 100)
        print(f"{error.validator=}")
        print(f"{error.message=}")


@task
def validate_test_file(ctx):
    """ Test the schema validation against a test file"""
    preflight_checklist()
    jsonfile = "./src/data/stations/schema-test.json"

    validate_station_file(jsonfile)


@task
def validate_stations_in_folder(ctx, folder, exit_on_errors=False):
    """
    Validate all json files in given folder

    If exit_on_error only print errors of first file that does not validate, then exit
    """
    preflight_checklist()
    filenames = [fn for fn in Path(folder).iterdir() if fn.as_posix().endswith(".json")]
    for filename in filenames:
        errors = validate_station_file(filename)
        if errors:
            output_validation_errors(errors, filename)
            if exit_on_errors:
                exit()
            errors = None
