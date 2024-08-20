package com.example.rostermanagementandroidsystem.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.rostermanagementandroidsystem.R
import com.example.rostermanagementandroidsystem.databinding.FragmentProfileBinding
import org.json.JSONObject

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    private var userId: Int = -1


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Create view of user's credential details and allow updating new info
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        arguments?.let { bundle ->
            userId = bundle.getInt("user_id", -1)
        }

        if (userId != -1) {
            fetchUserProfile(userId)
        } else {
            Toast.makeText(context, "User ID is not set", Toast.LENGTH_SHORT).show()
        }

        // Allow user updating their account details on a dialog
        binding.btnEditAccount.setOnClickListener {
            showEditAccountDialog()
        }
    }

    // fetch user's details to display
    private fun fetchUserProfile(userId: Int) {
        val url = "http://10.0.2.2:3000/api/accounts/$userId"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.GET, url, null,
            Response.Listener { response ->
                val success = response.getBoolean("success")
                if (success) {
                    val account = response.optJSONObject("account") ?: JSONObject()
                    val fullname = account.optString("fullname", "N/A")
                    val password = account.optString("password", "N/A")

                    binding.tvFullName.text = "Username: $fullname"
                    binding.tvPassword.text = "Pin Number: $password"
                } else {
                    Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Failed to fetch profile", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // Show Edit Account on a dialog with components
    private fun showEditAccountDialog() {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_edit_account, null)
        val editUsername = dialogView.findViewById<EditText>(R.id.etNewUsername)
        val editPassword = dialogView.findViewById<EditText>(R.id.etNewPassword)

        AlertDialog.Builder(requireContext())
            .setTitle("New credential information")
            .setView(dialogView)
            .setPositiveButton("Ok") { _, _ ->
                val newUsername = editUsername.text.toString().trim()
                val newPassword = editPassword.text.toString().trim()

                if (newUsername.isEmpty() && newPassword.isEmpty()) {
                    Toast.makeText(requireContext(), "Please fill in at least one field", Toast.LENGTH_SHORT).show()
                } else {
                    updateAccount(newUsername, newPassword)
                }
            }
            .setNegativeButton("Cancel", null)
            .create()
            .show()
    }

    // Handle update (put) action onto new user's credential info to api/update_account endpoint
    private fun updateAccount(newUsername: String, newPassword: String) {
        val url = "http://10.0.2.2:3000/api/update_account"
        val params = HashMap<String, String>().apply {
            put("userId", userId.toString())
            if (newUsername.isNotEmpty()) put("fullname", newUsername)
            if (newPassword.isNotEmpty()) put("password", newPassword)
        }
        val jsonObject = JSONObject(params as Map<*, *>)

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.POST, url, jsonObject,
            Response.Listener { response ->
                val success = response.getBoolean("success")
                if (success) {
                    Toast.makeText(context, "Account updated successfully", Toast.LENGTH_SHORT).show()
                    fetchUserProfile(userId)
                } else {
                    Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Failed to update account", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // Destructor
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
