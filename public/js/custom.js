// Transition effect for navbar
const navbar = document.querySelector(".navbar");
const navbarBrand = document.querySelector(".navbar .brand").classList;
function scrollFunction() {
  // Checks if window is scrolled more than 30px, adds/removes bg-white and shadow class
  if (document.body.scrollTop > 30 || document.documentElement.scrollTop > 30) {
    navbar.classList.add("shadow","bg-nav");
    navbarBrand.add("brand-color");
  } else {
    navbar.classList.remove("shadow","bg-nav");
    navbarBrand.remove("brand-color");
  }
}
// Call the function once the page loads to ensure that navbar gets solid if it's in scrolled position
scrollFunction();
// Call the function if user scrolls
window.onscroll = function() {
  scrollFunction()
};

// Cookie consent


// theme JS

