// Sidebar Menu Logic
function openMenu() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("active");
}

function closeMenu() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
}

// LocalStorage Save & Load Logic
window.onload = function() {
    const savedName = localStorage.getItem("player_name");
    const savedImage = localStorage.getItem("player_image");
    const savedVolume = localStorage.getItem("game_volume");

    if (savedName) document.getElementById("nameInput").value = savedName;
    if (savedImage) document.getElementById("profilePicPreview").src = savedImage;
    if (savedVolume) document.getElementById("volumeSlider").value = savedVolume;
};

// Image Preview Logic
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePicPreview').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// Save Settings Data
function saveData() {
    const name = document.getElementById("nameInput").value;
    const image = document.getElementById("profilePicPreview").src;
    const volume = document.getElementById("volumeSlider").value;

    localStorage.setItem("player_name", name);
    localStorage.setItem("player_image", image); 
    localStorage.setItem("game_volume", volume);

    alert("Settings Saved Successfully!");
    closeMenu();
}


