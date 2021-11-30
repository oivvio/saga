from pathlib import Path
from jsonschema import Draft7Validator, RefResolver
from json import load

from json.decoder import JSONDecodeError

# from json.decode import JSONDecodeError
from pprint import pprint


def load_complete_game(filename):
    """
    load a gameconfig from file name + stations files

    return complete gameconfig (with stations data added)

    """
    with open(filename) as handle:
        try:
            data = load(handle)
            # except JSONDecodeError as err:
        except JSONDecodeError:
            print(
                f"[007] Game config file at path {filename} is not valid JSON. Terminating validation."
            )
            exit()

    for station_path in data["stationPaths"]:
        path = Path(filename).parent.joinpath(station_path)

        try:
            with open(path) as handle:
                try:
                    station_data = load(handle)
                # except JSONDecodeError as err:
                except JSONDecodeError:
                    print(
                        f"[006] Station file at path '{path}' is not valid JSON. Terminating validation."
                    )
                    exit()
        except FileNotFoundError:
            print(f"Station file at path '{path}' does not exists.")

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


def _output_validation_errors(errors, filename):
    """Output validation errors and filename for human consumption"""
    if errors:
        print("=" * 100)
        print(f"{filename} has {len(errors)} errors.")
        for error in errors:
            print("-" * 100)
            print(f"{error.validator=}")
            print(f"{error.path=}")
            print(f"{error.message=}")
        print()


def output_validation_errors(errors, filename):
    """Output validation errors and filename for human consumption"""
    if errors:
        for error in errors:
            print(
                f"[008] {filename} has {len(errors)} errors.|{error.validator}|{error.path}|{error.message}"
            )


def validate_station_file(filename):
    """Validate a given file against our schema a return a list of errors"""

    with open(filename) as handle:
        json_to_check = load(handle)
    return validate_station(json_to_check)


def validate_station_file_and_output_errors(filename):
    """Validate a given file against our schema an print a list of errors"""

    errors = validate_station_file(filename)
    output_validation_errors(errors, filename)


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


def deep_validation_of_event(station, event, filename):

    station_id = station["id"]
    station_filepath = station["filePath"]

    # Check that station_id is same as in file name
    if station_id not in station_filepath:
        print(
            f"[009] Station id '{station_id}' of station defined in '{station_filepath}' does not match file name.  "
        )

    # Check for existance of main audio
    if event["action"] == "playAudio":
        for audiofile_base in event["audioFilenames"]:
            audiofile_path = Path(filename).parent.joinpath(audiofile_base)

            if not audiofile_path.exists():
                print(
                    f"[005] The audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
                )
    # Check for existance of background audio
    if event["action"] == "playBackgroundAudio":
        audiofile_base = event["audioFilename"]

        audiofile_path = Path(filename).parent.joinpath(audiofile_base)

        if not audiofile_path.exists():
            print(
                f"[004] The audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
            )

    # Check for existance of audioFiles specific to powerNameChoice
    if event["action"] == "powerNameChoice":
        try:
            for audiofile_base in [
                event["onSuccessPlay"],
                event["onFirstFailurePlay"],
                event["onSecondFailurePlay"],
                event["ghostOnSuccessPlay"],
                event["ghostOnFirstFailurePlay"],
                event["ghostOnSecondFailurePlay"],
            ]:
                audiofile_path = Path(filename).parent.joinpath(audiofile_base)
                if not audiofile_path.exists():
                    print(
                        f"[011] The audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
                    )
        except KeyError as error:
            print(f"[012] missing keys in {station_filepath}  ")
    # Check that this files exist
    if event["action"] == "playAudioBasedOnAdHocValue":
        for audiofile_base in event["audioFilenameMap"].values():
            audiofile_path = Path(filename).parent.joinpath(audiofile_base)
            if not audiofile_path.exists():
                print(
                    f"[003] The audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
                )

    # Recurse into choiceBasedOnTags
    if event["action"] == "choiceBasedOnTags":
        deep_validation_of_event(station, event["eventIfPresent"], filename)
        deep_validation_of_event(station, event["eventIfNotPresent"], filename)

    # Check the next level events
    if "then" in event:
        next_level_event = event["then"]
        deep_validation_of_event(station, next_level_event, filename)


def deep_validation_of_station(gameconfig, station, station_ids, filename):
    """Validate stuff about a station that json schema can not give us"""

    choice_infix = gameconfig["choiceInfix"]
    station_id = station["id"]
    station_filepath = station["filePath"]

    # Check for existance of help audio
    if "helpAudioFilenames" in station:
        for audiofile_base in station["helpAudioFilenames"]:
            audiofile_path = Path(filename).parent.joinpath(audiofile_base)
            if not audiofile_path.exists():
                print(
                    f"[002] The help audiofile '{audiofile_base}' referenced from station '{station_id}' defined in {station_filepath}, does not exist."
                )

    # If a stations opens choice files make sure they have valid names.
    if "opens" in station:
        choice_names = gameconfig["choiceNames"]
        valid_choice_station_names = [
            f"{station_id}{choice_infix}{choice_name}" for choice_name in choice_names
        ]
        for choice_station in [s for s in station["opens"] if choice_infix in s]:
            if choice_station not in valid_choice_station_names:

                print(
                    f"[001] '{choice_station}' referenced from {station_id} is not a valid choice station name"
                )

    if station["type"] in ["story", "choice"]:
        for event in station["events"]:
            deep_validation_of_event(station, event, filename)

        # check that all references stations exist

        if "opens" in station:
            for station_open_id in station["opens"]:
                if station_open_id not in station_ids:
                    print(
                        f"The station  '{station_open_id}' referenced from station '{station_id}' defined in {station['filePath']}, does not exist."
                    )


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
    gameconfig = data

    # validate game config
    errors = validate_gameconfig_helper(filename)
    output_validation_errors(errors, filename)

    stations = data["stations"]
    station_ids = data["stations"].keys()

    # check that globalHelpAudio files exist
    for key, audiofile_base in data["globalAudioFilenames"].items():
        audiofile_path = Path(filename).parent.joinpath(audiofile_base)
        if not audiofile_path.exists():
            print(
                f"[009] The audiofile '{audiofile_base}' referenced from 'globalHelpAudio.{key}' in {filename}  does not exist. "
            )

    # validate all individual stations against the station schema
    for station_id in station_ids:
        station = stations[station_id]
        errors = validate_station(station)
        station_filename = station["filePath"]
        output_validation_errors(errors, station_filename)

        # Validate that any station that has helpAudioFilenames also have helpCost and vice versa.
        # I could not figure out how to do this in JSON schema. But it should be possible.
        has_help_cost = "helpCost" in station
        has_help_audio_files = "helpAudioFilenames" in station

        if has_help_cost != has_help_audio_files:
            print(
                f"[010] The station in '{station_filename}'  has inconsistent help options. If helpAudioFilenames is defined helpCost must be defined too."
            )

    # check that any choice stations have valid ids
    for station in [s for s in stations.values() if s["type"] == "choice"]:
        station_id = station["id"]
        station_filepath = station["filePath"]
        choice_infix = data["choiceInfix"]

        choice = station_id.split("-")[-1]

        invalid_choice_name = choice not in data["choiceNames"]

        last_part_should_be = choice_infix + choice

        last_part_is_not_correct = not station_id.endswith(last_part_should_be)

        if (
            choice_infix not in station_id
            or invalid_choice_name
            or last_part_is_not_correct
        ):
            print(
                f"The station id '{station_id}' defined in {station_filepath}, is not valid for a choice station."
            )

    for station in stations.values():
        deep_validation_of_station(gameconfig, station, station_ids, filename)
