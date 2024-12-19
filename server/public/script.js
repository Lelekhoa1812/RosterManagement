document.addEventListener('DOMContentLoaded', () => {

    const navbarMenu = document.querySelector(".navbar .links");
    const hamburgerBtn = document.querySelector(".hamburger-btn");
    const hideMenuBtn = navbarMenu.querySelector(".close-btn");
    const showPopupBtn = document.querySelector(".login-btn");
    const formPopup = document.querySelector(".form-popup");
    const hidePopupBtn = formPopup.querySelector(".close-btn");
    const signupLoginLink = formPopup.querySelectorAll(".bottom-link a");
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const termsLink = document.getElementById('terms-link');
    const modal = document.getElementById('terms-modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const welcomeMessage = document.getElementById('welcome-message');

    // Add event listener for "Instructions" page link
    const instructionsLink = document.querySelector('.links a[href="instruction.html"]');
    instructionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'instruction.html';
    });

    // Add event listener for "Home" link in the instruction.html page
    if (window.location.pathname.includes('instruction.html')) {
        const homeLink = document.querySelector('.links a[href="#"]');
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // Control boolean variable to check if user has signed up
    let isSigned = false;

    // Show mobile menu
    hamburgerBtn.addEventListener("click", () => {
        navbarMenu.classList.toggle("show-menu");
    });

    // Hide mobile menu
    hideMenuBtn.addEventListener("click", () => hamburgerBtn.click());

    // Show login popup
    showPopupBtn.addEventListener("click", () => {
        document.body.classList.toggle("show-popup");
        welcomeMessage.style.display = "none"; // Hide welcome message
    });

    // Hide login popup
    hidePopupBtn.addEventListener("click", () => {
        document.body.classList.remove("show-popup");
        if (isSigned) {
            welcomeMessage.style.display = "block"; // Show welcome message
        }
    });

    // Show or hide signup form
    signupLoginLink.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            formPopup.classList[link.id === 'signup-link' ? 'add' : 'remove']("show-signup");
            welcomeMessage.style.display = "none"; // Hide welcome message
        });
    });

    // Handle signup form submission
    document.getElementById('signup-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const policy = document.getElementById('policy').checked;

        if (!policy) {
            alert('You must agree to the Terms & Conditions.');
            return;
        }

        const data = { username, email, password };

        fetch('/api/business_signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Account created successfully');
                // Optionally, redirect to login page or clear form
                document.getElementById('signup-form').reset();
                formPopup.classList.remove("show-signup");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });

   // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const loginData = { username, password };

        fetch('/api/business_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Fetch the code using the new endpoint
                fetch('/api/get_code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                })
                .then(response => response.json())
                .then(codeData => {
                    if (codeData.error) {
                        alert(codeData.error);
                    } else {
                        const welcomeMessage = document.querySelector('.welcome-message');
                        welcomeMessage.innerHTML = `
                            <h3>Hello ${username}, welcome back!</h3>
                            <p>Keep in mind your business login code is ${codeData.code}.</p>
                            <p> </p>
                            <h3>Instruction:</h3>
                            <p>Log in at the credential page as the following default admin user details:</p>
                            <p>Username: Admin</p>
                            <p>Password: 1234</p>
                            <p>Then go to your Profile page to change any preferences to this admin account.</p>
                            <p>Please visit our manual instruction page for more information.</p>
                            <p> </p>
                            <p>Please download our app at abc.com</p>
                        `;
                        welcomeMessage.style.display = 'block';
                        document.body.classList.remove('show-popup');
                        isSigned = true;
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('An error occurred while fetching the code. Please try again.');
                });
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });

    // Show terms and conditions modal
    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = "block";
    });

    // Close terms and conditions modal
    closeModal.addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = "none";
        }
    });
});