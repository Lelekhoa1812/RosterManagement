app/
├── manifests/
│    ├── AndroidManifest.xml
├── kotlin+java/
│    ├── com.example.rostermanagementandroidsystem/
│    │    ├── ui/
│    │    │    ├── galery/
│    │    │    ├── home/
│    │    │    ├── slideshow/
│    │    │    ├── profile/
│    │    │    │    ├── ProfileFragment.kt // View your user's credential info and allow updating
│    │    ├── sign_up/
│    │    │    ├── SignUpFragment.kt // Post sign up credential information
│    │    ├── credential/
│    │    │    ├── CredentialFragment.kt // Process credential login data
│    │    ├── admin_management/
│    │    │    ├── AdminManagementFragment.kt // Control action and UI on Admin (manger) page
│    │    │    ├── ShiftsAdapter.kt // Adapt action on the shift card with display
│    │    ├── user_management/
│    │    │    ├── UserManagementFragment.kt // Control action and UI on User (staff) page
│    │    ├── utils/
│    │    │    ├── NetworkUtils.kt // Handle utilities across classes
│    │    ├── MainActivity.kt
│    ├── (Android test)
│    ├── (test)
├── res/
│    ├── drawable/
│    ├── layout/
│    │    ├── ...
│    │    ├── app_bar_main.xml
│    │    ├── dialog_add_note.xml // Pop-up dialog
│    │    ├── dialog_edit_account.xml // Pop-up dialog
│    │    ├── fragment_admin_management.xml
│    │    ├── fragment_user_management.xml
│    │    ├── fragment_credential.xml
│    │    ├── fragment_sign_up.xml
│    │    ├── fragment_profile.xml
│    │    ├── shift_item.xml  // Layout for individual shift item in RecyclerView
│    │    ├── timepicker.xml  // Construct timepicker form to select date-time data entry
│    ├── menu/
│    ├── mipmap/
│    ├── navigation/
│    │    ├── mobile_navigation.xml // Navigation rules across platform
│    ├── values/
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

server/
├── index.js

src/
├── RosterManagement.sql
├── layout.md (this)
├── personicon.png (profile icon)
├── rostericon.png (app icon)