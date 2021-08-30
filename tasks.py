import os
from invoke import task

from os import DirEntry
from jsonschema import validate
from jsonschema import Draft7Validator
from json import load

import sys


def preflight_checklist():
    """Stuff we want to check before running our tasks """

    # Check that we are in the right folder
    if not os.path.exists("tasks.py"):
        print("Please run tasks from the root project folder")
        exit()


def validate_station_file(filename):
    with open("./schemas/schema.json") as file:
        schema = load(file)

    print(schema)
    print(filename)


@task
def validate_test_file(ctx):
    """ Test the schema validation """
    preflight_checklist()
    jsonfile = "./src/data/stations/schema-test.json"

    validate_station_file(jsonfile)
