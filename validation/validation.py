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
        data["stations"][station_id]["filePath"] = path.as_posix()
    return data


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
    with open("./validation/schemas/jsonschema-draft-v7.json") as handle:
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
        print()


def validate_station_file(filename):
    """Validate a given file against our schema a return a list of errors"""

    with open(filename) as handle:
        json_to_check = load(handle)
    return validate_station(json_to_check)


def validate_station(station):
    """Validate a station against our schema a return a list of errors"""

    schemafile = "./validation/schemas/station.json"
    with open(schemafile) as handle:
        schema = load(handle)

    # Get the project folder
    base_uri = f"file://{Path(__file__).parents[0].as_posix()}/"

    # So that we can correctly resolve references to local files in our schema
    resolver = RefResolver(base_uri, schema)
    validator = Draft7Validator(schema, resolver=resolver)

    return [e for e in validator.iter_errors(station)]


def validate_gameconfig_helper(filename):
    """Validate a given game config file. Not the entire game"""

    schemafile = "./validation/schemas/game.json"
    with open(schemafile) as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    validator = Draft7Validator(schema)

    return [e for e in validator.iter_errors(json_to_check)]


def validate_game_helper(filename):
    """
    Validate a complete game consisting of a gameconfig, multiple station files and multiple audio files.

    Also do some checks that are hard to do with json schema
    """

    # load all game data
    data = load_complete_game(filename)

    # validate game config
    errors = validate_gameconfig_helper(filename)
    output_validation_errors(errors, filename)

    stations = data["stations"]
    station_ids = data["stations"].keys()

    # validate all individual stations against the station schema
    for station_id in station_ids:
        station = stations[station_id]
        errors = validate_station(station)
        station_filename = station["filePath"]
        output_validation_errors(errors, station_filename)

    # check that any choice stations have valid ids
    for station in [s for s in stations.values() if s["type"] == "choice"]:
        station_id = station["id"]
        station_filepath = station["filePath"]
        choice_infix = data["choiceInfix"]

        choice = station_id.split("-")[-1]

        invalid_choice_name = choice not in data["choiceNames"]
        if choice_infix not in station_id or invalid_choice_name:
            print(
                f"The station id '{station_id}' defined in {station_filepath}, is not valid for a choice station."
            )

    # check that all referenced audio files exist
    for station in stations.values():
        for event in station["events"]:

            # Check for existance of main audio
            if event["action"] == "playAudio":
                for audiofile_base in event["audioFilenames"]:

                    audiofile_path = Path(filename).parent.joinpath(audiofile_base)

                    if not audiofile_path.exists():
                        station_id = station["id"]
                        station_filepath = station["filePath"]
                        print(
                            f"The audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
                        )
            # Check for existance of background audio
            if event["action"] == "playBackgroundAudio":
                audiofile_base = event["audioFilename"]

                audiofile_path = Path(filename).parent.joinpath(audiofile_base)

                if not audiofile_path.exists():
                    station_id = station["id"]
                    station_filepath = station["filePath"]
                    print(
                        f"The audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
                    )

    # check that all references stations exist
    for station in stations.values():
        for station_open_id in station["opens"]:
            if station_open_id not in station_ids:
                print(
                    f"The station  '{station_open_id}' referenced from station '{station_id}' defined in {station['filePath']}, does not exist."
                )

    pass
