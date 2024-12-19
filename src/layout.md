VER 2.0 (Online cloud database system management, allow multiple businesses to opt in with tokenized personal accessibility)
app/                                           // Android app side
├── manifests/
│    ├── AndroidManifest.xml
├── kotlin+java/
├── com.example.rostermanagementandroidsystem/
│    ├── ui/
│    │    ├── gallery/                         // Gallery-related UI components
│    │    ├── home/                            // Home-related UI components
│    │    ├── slideshow/                       // Slideshow-related UI components
│    │    ├── profile/                         // Profile-related UI components
│    │    │    ├── ProfileFragment.kt          // View user's credential info and allow updating
│    │    ├── sign_up/                         // Sign up-related UI components
│    │    │    ├── SignUpFragment.kt           // Post sign up credential information
│    │    ├── credential/                      // Credential-related UI components
│    │    │    ├── CredentialFragment.kt       // Process credential login data
│    │    ├── admin_management/                // Admin management-related UI components
│    │    │    ├── AdminManagementFragment.kt  // Control actions and UI on Admin (manager) page
│    │    │    ├── ShiftsAdapter.kt            // Adapt actions on the shift card with display
│    │    ├── user_management/                 // User management-related UI components
│    │    │    ├── UserManagementFragment.kt   // Control actions and UI on User (staff) page
│    │    ├── business_signin/                 // Business code control, database mapper components
│    │    │    ├── BusinessSignInFragment.kt   // Send the business code used to attempt mapping database
│    ├── utils/                                // Utility classes and helpers
│    │    ├── NetworkUtils.kt                  // Handle utilities across classes
│    ├── MainActivity.kt                       // Main entry point for the application
│    ├── (Android test)
│    ├── (test)
├── res/
│    ├── drawable/
│    ├── layout/
│    │    ├── ...
│    │    ├── nav_header_main.xml              // Control header
│    │    ├── app_bar_main.xml
│    │    ├── dialog_add_note.xml              // Pop-up dialog
│    │    ├── dialog_edit_account.xml          // Pop-up dialog
│    │    ├── fragment_admin_management.xml
│    │    ├── fragment_user_management.xml
│    │    ├── fragment_credential.xml
│    │    ├── fragment_sign_up.xml
│    │    ├── fragment_profile.xml
│    │    ├── fragment_business_sign_in.xml
│    │    ├── shift_item.xml                   // Layout for individual shift item in RecyclerView
│    │    ├── timepicker.xml                   // Construct timepicker form to select date-time data entry
│    ├── menu/
│    │    ├── main.xml                         // Main design
│    │    ├── activity_main_drawer.xml         // Side bar design
│    ├── mipmap/
│    ├── navigation/
│    │    ├── mobile_navigation.xml            // Navigation rules across platform
│    ├── values/                               // Default set values 
│    │    ├── colors.xml
│    │    ├── strings.xml
│    ├── xml/
│    │    ├── backup_rules.xml
│    │    ├── data_extraction.xml
│    │    ├── network_security_config.xml
gradle/
├── root build
├── app build
├── settings.gradle.kts

server/                                        // Server and Web side
├── index.js
├── public/
│    ├── img/                                  // Website component images
│    ├── index.html
│    ├── instruction.html
│    ├── script.js
│    ├── style.css

src/
├── RosterManagement.sql
├── layout.md                                  // this
├── personicon.png                             // profile icon
├── rostericon.png                             // app icon

node_modules/                                  // Node server component
package.json
package-lock.json