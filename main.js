function state() {
    return {
        user: {
            showQRScanner: false,
            stationsVisited: [],
        },
        fakeId: "test-01",
        fakeScan: function(audio_id) {
            console.log("fakeScan", audio_id);

            this.tryStory(audio_id);
            this.user.showQRScanner = false;
        },
        showQRScanner: function() {
            this.user.showQRScanner = true;
            scanQRCode(audio_id => {
                this.tryStory(audio_id);
            });
        },
        tryStory: function(audio_id) {
            let user = this.user;
            let state = this;
            let visited = [];

            // Will add the story to user data
            if (user.stationsVisited.includes(audio_id)) {
                //TODO: push user to next track
                console.log("User already visited this story")
            } else {
                user.stationsVisited.push(audio_id)
            } 
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    window.initQR();
});

window.state = state;