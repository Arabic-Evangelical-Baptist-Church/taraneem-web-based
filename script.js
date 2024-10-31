let songsList = []
let playlist = [];
const broadcastChannel = new BroadcastChannel('verse_channel');

const loadJson = async() => {
     try {
        const response = await fetch('taraneemDB.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        songsList = data;
    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}


loadJson();


const searchSongs = () => {
    const query = document.getElementById('song-search-input').value.toLowerCase();
    const results = songsList.filter(song => {
        // Check if the title matches the query
        const titleMatch = song.title.toLowerCase().includes(query);

        // Check if any verse matches the query
        const versesMatch = song.verses && song.verses.some(verseArray =>
            verseArray.some(verse => verse.toLowerCase().includes(query))
        );

        return titleMatch || versesMatch; // Return true if either matches
    });
    displayResults(results);
}

const displayResults = (results) => {
    const resultsList = document.getElementById('search-results');
    resultsList.innerHTML = ''; // Clear previous results

    if (results.length > 0) {
        results.forEach(song => {
            const li = document.createElement('li');
            li.textContent = song.title;
            li.classList.add('single-search-result')

            const btn = document.createElement('button')
            btn.classList.add('add-to-playlist')
            btn.textContent = 'Add to Playlist'

            btn.addEventListener('click', (event) => {
                event.stopPropagation()
                addToPlaylist(song)
            });

            li.appendChild(btn)
            resultsList.appendChild(li);
        });
    } else {
        resultsList.innerHTML = '<li>No results found</li>';
    }
}

const formatSong = song => {

    const verses = []

    if(song.verses){
        song.verses.forEach(verseArray => {
            verseArray.forEach(verse => verses.push({verse, type: 'verse'}))

            if(song.chorus){
                song.chorus.forEach(verse => verses.push({verse, type: 'chorus'}))
            }
        });
    }

    return {
        title: song.title,
        verses
    }
}


// Function to add a song to the playlist
const addToPlaylist = (song) => {

    const formattedSong = formatSong(song)

    if (!playlist.includes(formattedSong)) {
        playlist.push(formattedSong);
        updatePlaylistDisplay();
    }
};

// Function to update the playlist display
const updatePlaylistDisplay = () => {
    const playlistList = document.getElementById('playlist');
    playlistList.innerHTML = ''; // Clear previous playlist

    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = song.title;
        li.dataset.index = index; // Store the index for sorting

        // Add click event to display verses when the playlist item is clicked
        li.addEventListener('click', () => displayVersesOnControllerScreen(song));

        playlistList.appendChild(li);

    });

     // Make the playlist sortable
    new Sortable(playlistList, {
        onEnd: (event) => {
            // Update the playlist array based on the new order
            const movedItem = playlist.splice(event.oldIndex, 1)[0];
            playlist.splice(event.newIndex, 0, movedItem);
        }
    });
};

const displayVersesOnControllerScreen = (song) => {
    const versesList = document.getElementById('verses-list');
    versesList.innerHTML = ''; // Clear previous verses

    if (song.verses) {
        song.verses.forEach((verseObj, index) => {
            const li = document.createElement('li');
            li.innerHTML = verseObj.verse.replace(/\n/g, '<br>');

            if(verseObj.type === 'chorus'){
                li.classList.add('chorus-li')
            }

            // Add click event to send broadcast message
            li.addEventListener('click', () => {
                sendBroadcastMessage(song, index)

                // Remove 'selected' class from all verses in one go
                const versesList = document.querySelector('ul#verses-list');
                versesList.querySelectorAll('li.selected').forEach((selectedLi) => {
                    selectedLi.classList.remove('selected');
                });

                // Add 'selected' class to the clicked verse
                li.classList.add('selected');
            });

            versesList.appendChild(li);
        })
    }
};

const sendBroadcastMessage = (song, index) => {
    const currentVerse = song.verses[index].verse
    const nextVerse = song.verses[index + 1] ? song.verses[index + 1].verse : ''

    const message = {
        currentVerse,
        nextVerse
    };

    broadcastChannel.postMessage(message); // Send the message
};


// Event listener for the search button
document.getElementById('song-search-input').addEventListener('keyup', searchSongs);
document.getElementById('song-search-input').addEventListener('keyup', searchSongs);
