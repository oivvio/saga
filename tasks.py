import os
import sys
import shutil

from json import load
from json import dumps
from urllib.parse import urljoin
import graphviz

from invoke import task
from jsonschema import Draft7Validator, RefResolver
import qrcode
from PIL import ImageDraw
from pathlib import Path

from validation.validation import validate_gameconfig_helper
from validation.validation import validate_station_file
from validation.validation import validate_station_file_and_output_errors
from validation.validation import output_validation_errors
from validation.validation import validate_schema_helper
from validation.validation import validate_stations_in_folder_helper
from validation.validation import validate_game_helper
from validation.validation import load_complete_game


TYPESCRIPT_FILES_FINDER = f"find .|grep '\.ts$'|grep -v '#'"


def preflight_checklist():
    """Stuff we want to check before running our tasks"""

    # Check that we are in the right folder
    if not os.path.exists("tasks.py"):
        print("Please run tasks from the root project folder")
        exit()


@task
def validate_game(ctx, filename):
    """Validate a complete game consisting of a gameconfig, multiple station files and multiple audio files"""
    preflight_checklist()
    validate_game_helper(filename)


@task
def validate_station(ctx, filename):
    """Validate a single station file"""
    preflight_checklist()
    validate_station_file_and_output_errors(filename)


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
    """Test the schema validation against a test file"""
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
    """Check that our TypeScript is OK"""
    preflight_checklist()

    if watch:
        watch_prefix = f"{TYPESCRIPT_FILES_FINDER}|entr -c "
    else:
        watch_prefix = " "

    cmd = f"{watch_prefix} ./node_modules/.bin/eslint . --cache --ext  .ts"
    ctx.run(cmd, pty=True)


@task
def typescript_typecheck(ctx, watch=True):
    """Check that our TypeScript compiles"""
    preflight_checklist()

    watch = " --watch " if watch else ""

    cmd = f"./node_modules/.bin/tsc --project tsconfig.json {watch}"
    ctx.run(cmd, pty=True)


@task
def deploy_to_s3(ctx):
    """Build and deploy to an s3 bucket - requires aws secrects to be configured."""

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
def deploy_to_khst(ctx, username, password):
    """Build and deploy to khst via sftp"""

    preflight_checklist()

    # Build
    vue_build(ctx)

    lftpcmd = f"open -u {username},{password} sftp://sprickan.kulturhusetstadsteatern.se:22;mirror --verbose --parallel=10 -R dist/ /;exit"
    cmd = f"lftp -e '{lftpcmd}'"
    print(cmd)
    ctx.run(cmd, pty=True)

    # Output instructions
    # full_url = "https://libtechplayground.s3.eu-north-1.amazonaws.com/sprickan/index.html?configUrl=https://libtechplayground.s3.eu-north-1.amazonaws.com/sprickan/data/gameconfig.json&displayDevBox=yes"
    # print()
    # print("Deployed to S3. Try it out at the following URL: ")
    # print(full_url)


@task
def generate_qr_codes(ctx, filename):
    """Generate qr codes for the game defined in the supplied game config. Outputs to /tmp"""
    preflight_checklist()
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


@task
def generate_html_files(ctx, filename):
    """Generate index.html files for the game defined in the supplied game config. Outputs to /tmp"""
    preflight_checklist()

    # We pick up index.html from the same folder where filename is located
    html_template = Path(filename).parent / "index.html"

    game_data = load_complete_game(filename)
    choice_infix = game_data["choiceInfix"]

    station_ids = [s for s in game_data["stations"].keys() if choice_infix not in s]

    # Add global choice stations
    for choice in game_data["choiceNames"]:
        station_ids.append(f"{choice_infix}{choice}")

    for station_id in station_ids:
        output_dir = Path("public") / station_id
        if not output_dir.exists():
            output_dir.mkdir(parents=True)

        output_file = output_dir / "index.html"
        print(output_file)

        shutil.copy(html_template, output_file)


@task
def vue_build(ctx):
    """Build the project for deployment"""
    preflight_checklist()

    cmd = f"./node_modules/.bin/vue-cli-service build"
    print(cmd)
    ctx.run(cmd, pty=True)


@task
def vue_devserver(ctx, port=8080, host="0.0.0.0"):
    """Run the Vue dev server"""
    preflight_checklist()

    cmd = (
        f"./node_modules/.bin/vue-cli-service serve --https --port {port} --host {host}"
    )
    print(cmd)
    ctx.run(cmd, pty=True)


@task
def cartesian_product(ctx, lst1, lst2):
    """Provide commaseparated list of strings"""

    lst1 = [t.strip() for t in lst1.split(",")]
    lst2 = [t.strip() for t in lst2.split(",")]

    result = []
    for item1 in lst1:
        for item2 in lst2:
            result.append([item1, item2])

    print(dumps(result, indent=4))


@task
def graph(ctx, filename, output="Desktop/gamegraph.gv", format="png"):
    """Create a graphviz png graph from a gameconfig"""
    preflight_checklist()
    game_data = load_complete_game(filename)

    dot = graphviz.Digraph(comment=game_data["name"], format=format)

    stations = game_data["stations"]

    # add a node for each station
    def add_edge(src_station, dst_station):
        dot.edge(src_station, dst_station)

    def handle_event(station, event):

        station_id = station["id"]

        if event["action"] in ["goToStation", "openStation"]:
            to_station = event["toStation"]
            add_edge(station_id, to_station)

        if event["action"] == "switchGotoStation":
            for switch in event["switch"]:
                to_station = switch["parameters"]["toStation"]
                add_edge(station_id, to_station)

        if event["action"] == "choiceBasedOnTags":
            handle_event(station, event["eventIfPresent"])
            handle_event(station, event["eventIfNotPresent"])

        if event["action"] == "powerNameChoice":
            for to_station in event["onSuccessOpen"]:
                add_edge(station_id, to_station)
            for to_station in event["ghostOnSuccessOpen"]:
                add_edge(station_id, to_station)

            add_edge(station_id, event["onSecondFailureGoTo"])
            add_edge(station_id, event["ghostOnSecondFailureGoTo"])
            for to_station in event["ghostOnSuccessOpen"]:
                add_edge(station_id, to_station)

        if "condition" in event and event["condition"] in [
            "adHocKeysAreEqual",
            "adHocKeysAreNotEqual",
        ]:

            for switch in event["switch"]:
                to_station = switch["parameters"]["toStation"]
                add_edge(station_id, to_station)

        if "then" in event:
            handle_event(station, event["then"])

    def handle_station(station):
        station_id = station["id"]

        # nodes for open
        try:
            for sub_station_id in station["opens"]:
                add_edge(station_id, sub_station_id)
        except KeyError:
            pass

        if station["type"] == "help":
            add_edge(station_id, station["startStationId"])

        try:
            for event in station["events"]:
                handle_event(station, event)
        except KeyError:
            pass

    for station in stations.values():
        dot.node(station["id"], station["id"])

    for station_id, station in game_data["stations"].items():
        handle_station(station)

    output = Path(Path.home(), output)
    print(f"Your graph file is at {output}.{format}")
    dot.render(output)
