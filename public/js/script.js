(function () {
  const newBtn = document.querySelector(".drop-down-btn--new");
  const userIconBtn = document.querySelector(".drop-down-btn--user");
  const dropDownNew = document.querySelector(".drop-down-new");
  const dropDownUser = document.querySelector(".drop-down-user");
  const dropDownMenus = document.querySelectorAll(".drop-down");

  newBtn.addEventListener("click", (e) => {
    if (window.getComputedStyle(dropDownNew).display === "none") {
      dropDownNew.style.display = "block";
      newBtn.style.backgroundColor = "#000";
      newBtn.style.color = "#fff";
    } else {
      dropDownNew.style.display = "none";
      newBtn.style.backgroundColor = "#fff";
      newBtn.style.color = "#000";
    }
  });

  userIconBtn.addEventListener("click", (e) => {
    if (window.getComputedStyle(dropDownUser).display === "none") {
      dropDownUser.style.display = "block";
    } else {
      dropDownUser.style.display = "none";
    }
  });
})();
