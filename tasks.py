import os
import sys
from invoke import task

from validation.validation import validate_gameconfig_helper
from validation.validation import validate_station_file
from validation.validation import output_validation_errors
from validation.validation import validate_schema_helper
from validation.validation import validate_stations_in_folder_helper
from validation.validation import validate_game_helper
from validation.validation import load_complete_game

from jsonschema import Draft7Validator, RefResolver
from json import load

from json import dumps
from urllib.parse import urljoin
import qrcode
from PIL import ImageDraw


TYPESCRIPT_FILES_FINDER = f"find .|grep '\.ts$'|grep -v '#'"


def preflight_checklist():
    """ Stuff we want to check before running our tasks """

    # Check that we are in the right folder
    if not os.path.exists("tasks.py"):
        print("Please run tasks from the root project folder")
        exit()


@task
def validate_game(ctx, filename):
    """Validate a complete game consisting of a gameconfig, multiple station files and multiple audio files """
    preflight_checklist()
    validate_game_helper(filename)


@task
def validate_gameconfig(ctx, filename):
    """Validate a given game config file. Not the enire game"""
    preflight_checklist()
    for error in validate_gameconfig_helper(filename):
        print(error)


@task
def validate_schema(ctx, filename):
    """Validate a json schema itself."""
    preflight_checklist()
    validate_schema_helper(filename)


@task
def validate_test_file(ctx):
    """ Test the schema validation against a test file"""
    preflight_checklist()
    jsonfile = "./src/data/stations/schema-test.json"

    errors = validate_station_file(jsonfile)
    output_validation_errors(errors, jsonfile)


@task
def validate_stations_in_folder(ctx, folder, exit_on_errors=False):
    """
    Validate all json files in given folder

    If exit_on_error only print errors of first file that does not validate, then exit
    """
    preflight_checklist()
    validate_stations_in_folder_helper(folder, exit_on_errors)


@task
def typescript_lint(ctx, watch=True):
    """ Check that our TypeScript is OK """
    preflight_checklist()

    if watch:
        watch_prefix = f"{TYPESCRIPT_FILES_FINDER}|entr -c "
    else:
        watch_prefix = " "

    cmd = f"{watch_prefix} ./node_modules/.bin/eslint . --cache --ext  .ts"
    ctx.run(cmd, pty=True)


@task
def typescript_typecheck(ctx, watch=True):
    """ Check that our TypeScript compiles """
    preflight_checklist()

    watch = " --watch " if watch else ""

    cmd = f"./node_modules/.bin/tsc --project tsconfig.json {watch}"
    ctx.run(cmd, pty=True)


@task
def deploy_to_s3(ctx):
    """ Build and deploy to an s3 bucket - requires aws secrects to be configured. """

    preflight_checklist()

    # Build
    vue_build(ctx)

    # Push to s3
    cmd = f"aws s3 sync --acl public-read ./dist/  s3://libtechplayground/sprickan/"
    print(cmd)
    ctx.run(cmd, pty=True)

    # Output instructions
    full_url = "https://libtechplayground.s3.eu-north-1.amazonaws.com/sprickan/index.html?configUrl=https://libtechplayground.s3.eu-north-1.amazonaws.com/sprickan/data/gameconfig.json&displayDevBox=yes"
    print()
    print("Deployed to S3. Try it out at the following URL: ")
    print(full_url)


@task
def generate_qr_codes(ctx, filename):
    """ Generate qr codes for the game defined in the supplied game config. Outputs to /tmp """
    game_data = load_complete_game(filename)
    choice_infix = game_data["choiceInfix"]

    station_ids = [s for s in game_data["stations"].keys() if choice_infix not in s]

    # Add global choice stations
    for choice in game_data["choiceNames"]:
        station_ids.append(f"{choice_infix}{choice}")

    for station_id in station_ids:

        full_url = urljoin(
            game_data["baseUrl"] + "/", station_id, allow_fragments=False
        )
        qr_img = qrcode.make(full_url)
        filename = f"/tmp/{game_data['name']}-{station_id}.png"

        ImageDraw.Draw(qr_img).text((0, 0), station_id, 0)
        print(full_url)
        print(filename)
        qr_img.save(filename)

    # print(dumps(game_data, indent=2))


@task
def vue_build(ctx):
    """ Build the project for deployment """
    preflight_checklist()

    cmd = f"./node_modules/.bin/vue-cli-service build"
    print(cmd)
    ctx.run(cmd, pty=True)


@task
def vue_devserver(ctx, port=8080, host="0.0.0.0"):
    """ Run the Vue dev server """
    preflight_checklist()

    cmd = (
        f"./node_modules/.bin/vue-cli-service serve --https --port {port} --host {host}"
    )
    print(cmd)
    ctx.run(cmd, pty=True)
