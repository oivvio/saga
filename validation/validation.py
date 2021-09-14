from pathlib import Path
from jsonschema import Draft7Validator, RefResolver
from json import load
from pprint import pprint


def load_complete_game(filename):
    """
    load a gameconfig from file name + stations files

    return complete gameconfig (with stations data added)

    """
    with open(filename) as handle:
        data = load(handle)

    for station_path in data["stationPaths"]:
        path = Path(filename).parent.joinpath(station_path)

        with open(path) as handle:
            station_data = load(handle)
        station_id = station_data["id"]
        data["stations"][station_id] = station_data
    return data


def validate_game_helper(filename):
    """Validate a complete game consisting of a gameconfig, multiple station files and multiple audio files """

    # load all game data
    data = load_complete_game(filename)

    # calidate game config

    # validate all individual stations

    # check that all referenced audio files exist

    # check that all references stations exist

    pass


def validate_stations_in_folder_helper(folder, exit_on_errors=False):
    """
    Validate all json files in given folder

    If exit_on_error only print errors of first file that does not validate, then exit
    """

    filenames = [fn for fn in Path(folder).iterdir() if fn.as_posix().endswith(".json")]
    for filename in filenames:
        errors = validate_station_file(filename)
        if errors:
            output_validation_errors(errors, filename)
            if exit_on_errors:
                exit()
            errors = None


def validate_schema_helper(filename):
    """Validate a json schema itself."""
    with open("./schemas/jsonschema-draft-v7.json") as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    validator = Draft7Validator(schema)
    errors = [e for e in validator.iter_errors(json_to_check)]
    output_validation_errors(errors, filename)


def output_validation_errors(errors, filename):
    """ Output validation errors and filename for human consumption """
    if errors:
        print("=" * 100)
        print(f"{filename} has {len(errors)} errors.")
    for error in errors:
        print("-" * 100)
        print(f"{error.validator=}")
        print(f"{error.path=}")
        print(f"{error.message=}")


def validate_station_file(filename):
    """Validate a given file against our schema a return a list of errors"""

    schemafile = "./schemas/station.json"
    with open(schemafile) as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    # Get the project folder
    base_uri = f"file://{Path(__file__).parents[0].as_posix()}/"

    # So that we can correctly resolve references to local files in our schema
    resolver = RefResolver(base_uri, schema)
    validator = Draft7Validator(schema, resolver=resolver)

    return [e for e in validator.iter_errors(json_to_check)]


def validate_gameconfig_helper(filename):
    """Validate a given game config file. Not the enire game"""

    schemafile = "./schemas/game.json"
    with open(schemafile) as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    validator = Draft7Validator(schema)

    return [e for e in validator.iter_errors(json_to_check)]
