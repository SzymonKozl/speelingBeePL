// mobile-webpage-only logic
function onWordListClick() {
    const el = document.getElementById("discovered_words_container");
    if (el.style.animationDirection === "normal") el.style.animationDirection = "reverse";
    else el.style.animationDirection = "normal";
    if (el.classList.contains("mobileDiscoveredHolderAnim")) el.classList.remove("mobileDiscoveredHolderAnim");
    el.offsetHeight;
    el.classList.add("mobileDiscoveredHolderAnim");
}