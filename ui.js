$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $logoutButton = $('#logout-nav');
  const $favoritedArticles = $('#favorited-articles');
  const $navFavorite = $('#nav-favorite');


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;


  await checkIfLoggedIn();

//   $(document).ready(function(){
//     $(window).scroll(function(){
 
//        var wintop = $(window).scrollTop(), docheight = $(document).height(), winheight = $(window).height();
//        var  scrolltrigger = 0.95;
 
//        if  ((wintop/(docheight-winheight)) > scrolltrigger) {
//         generateStories(); 
//         console.log(we just)
         
//        }
//    });
//  });
  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    // $navForm.removeClass("hidden");
    $submitForm.toggleClass('hidden', false);
    $logoutButton.toggleClass('hidden', false); 
    loginAndSubmitForm();
  });

  $navFavorite.on("click", function () {
    generateFavoritedStories();
  });

  async function generateFavoritedStories() {

    $favoritedArticles.toggleClass("hidden", false);

    //need list of favorited stories from $.get metho
    $allStoriesList.empty();
    for (var i = 0; i < currentUser.favorites.length; i++) {
      let currentFavoritedStory = currentUser.favorites[i];
      $favoritedArticles.prepend(generateStoryHTML(currentFavoritedStory));
    }
    // get an instance of StoryList
    // const storyListInstance = await StoryList.getStories();
    // // update our global variable
    // storyList = storyListInstance;
    // // // empty out that part of the page


    // // loop through all of our stories and generate HTML for them
    // for (let story of storyList.stories) {
    //   const result = generateStoryHTML(story);
    //   $favoritedArticles.append(result);
      // }
    }

    /**
     * Event listener for signing up.
     *  If successfully we will setup a new user instance
     */
    $createAccountForm.on("submit", async function (evt) {
      evt.preventDefault(); // no page refresh

      // grab the required fields
      let name = $("#create-account-name").val();
      let username = $("#create-account-username").val();
      let password = $("#create-account-password").val();

      // call the create method, which calls the API and then builds a new user instance
      const newUser = await User.create(username, password, name);
      currentUser = newUser;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    });


    $submitForm.on("submit", async function (evt) {
      evt.preventDefault();

      let userData = {
        author: $('#author').val(),
        title: $('#title').val(),
        url: $('#url').val(),
      }

      const newStory = await storyList.addStory(currentUser, userData);

      $allStoriesList.prepend(generateStoryHTML(newStory));

    })

    /**
     * Log Out Functionality
     */
    $navLogOut.on("click", function () {
      // empty out local storage
      localStorage.clear();
      // refresh the page, clearing memory
      location.reload();
      $submitForm.toggleClass("hidden", true);
    });


    /**
     * Event Handler for Clicking Login
     */
    $navLogin.on("click", function () {
      // Show the Login and Create Account Forms
      $loginForm.slideToggle();
      $createAccountForm.slideToggle();
      $allStoriesList.toggle();

    });

    //Event handler for star click

    $allStoriesList.on("click", '.fa-star', toggleStar); 
    
    async function toggleStar(evt) {
      // console.log("star clicked");
      let parentStoryId = $(evt.target).parent().parent().attr('id');
      // debugger;
      if ($(evt.target).hasClass('far')) {
        await currentUser.appendFavorites(parentStoryId);
      }
      else {
        await currentUser.removeFavorites(parentStoryId);
      };
      $(evt.target).toggleClass('fas far');
      // $(evt.target).removeClass('far.fa-star'); 
    };

    $favoritedArticles.on("click", '.fa-star', toggleStar); 

    $allStoriesList.on('click', '.fa-trash', async function(evt) {
      let removeID = $(evt.target).parent().attr('id'); 
      let removedStoryID = await currentUser.deleteStory(removeID); 
      $allStoriesList.remove(`#${removedStoryID}`);
      generateStories(); 
    });




    /**
     * Event handler for Navigation to Homepage
     */
    $("body").on("click", "#nav-all", async function () {
      hideElements();
      await generateStories();
      $favoritedArticles.empty(); 
      $allStoriesList.show();
    });

    /**
     * On page load, checks local storage to see if the user is already logged in.
     * Renders page information accordingly.
     */
    async function checkIfLoggedIn() {
      // let's see if we're logged in
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");

      // if there is a token in localStorage, call User.getLoggedInUser
      //  to get an instance of User with the right details
      //  this is designed to run once, on page load
      currentUser = await User.getLoggedInUser(token, username);
      await generateStories();

      if (currentUser) {
        showNavForLoggedInUser();
        $logoutButton.toggleClass('hidden', false);
      } else {
        $submitForm.toggleClass("hidden", true);
        $logoutButton.toggleClass('hidden', true); 
      }
    }

    /**
     * A rendering function to run to reset the forms and hide the login info
     */
    function loginAndSubmitForm() {
      // hide the forms for logging in and signing up
      $loginForm.hide();
      $createAccountForm.hide();

      // reset those forms
      $loginForm.trigger("reset");
      $createAccountForm.trigger("reset");

      // show the stories
      $allStoriesList.show();

      // update the navigation bar
      showNavForLoggedInUser();
    }

    /**
     * A rendering function to call the StoryList.getStories static method,
     *  which will generate a storyListInstance. Then render it.
     */
    async function generateStories() {
      // get an instance of StoryList
      const storyListInstance = await StoryList.getStories();
      // update our global variable
      storyList = storyListInstance;
      // empty out that part of the page
      $allStoriesList.empty();

      // loop through all of our stories and generate HTML for them
      for (let story of storyList.stories) {
        const result = generateStoryHTML(story);
        $allStoriesList.append(result);
      }
    }

    /**
     * A function to render HTML for an individual Story instance
     */
    function generateStoryHTML(story) {
      let currStoryId = story.storyId;
      let hostName = getHostName(story.url);
      if (currentUser === null) {
        var starClass = 'far';
      } else {
        var starClass = (currentUser.hasFavorited(currStoryId)) ? 'fas' : 'far';
      }

      // render story markup
      const storyMarkup = $(`
      <li id="${story.storyId}" class='list-group-item'>
      <strong><i class="${starClass} fa-star"></i> </strong>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
        <i class="fa fa-trash">  
      </li>
    `);

      return storyMarkup;
    }



    // hide all elements in elementsArr
    function hideElements() {
      const elementsArr = [
        // $submitForm,
        $allStoriesList,
        $filteredArticles,
        $ownStories,
        $loginForm,
        $createAccountForm
      ];
      elementsArr.forEach($elem => $elem.hide());
    }

    function showNavForLoggedInUser() {
      $navLogin.hide();
      $navLogOut.show();
    }

    // simple function to pull the hostname from a URL
    function getHostName(url) {
      let hostName;
      if (url.indexOf("://") > -1) {
        hostName = url.split("/")[2];
      } else {
        hostName = url.split("/")[0];
      }
      if (hostName.slice(0, 4) === "www.") {
        hostName = hostName.slice(4);
      }
      return hostName;
    }

    // sync current user information to localStorage
    function syncCurrentUserToLocalStorage() {
      if (currentUser) {
        localStorage.setItem("token", currentUser.loginToken);
        localStorage.setItem("username", currentUser.username);
      }
    }
  });
