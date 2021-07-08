function state() {
    return {
        user: {
            showQRScanner: false,
            stationsVisited: [],
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
            for (var i = 0; i < user.stationsVisited.length; i++) {
                visited.push(user.stationsVisited[i].id)
            }
            
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    window.initQR();
});

window.state = state;