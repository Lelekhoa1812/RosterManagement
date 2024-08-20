package com.example.rostermanagementandroidsystem.ui.credential

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.rostermanagementandroidsystem.R
import com.example.rostermanagementandroidsystem.databinding.FragmentCredentialBinding
import org.json.JSONObject

// Login set up with determination to redirect user to their appropriate role (admin/user)
class CredentialFragment : Fragment() {

    private var _binding: FragmentCredentialBinding? = null
    private val binding get() = _binding!!

    // Create View
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentCredentialBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Set up, with function to process to log in
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.submitButton.setOnClickListener {
            login()
        }

        binding.createNewAccount.setOnClickListener {
            findNavController().navigate(R.id.action_credentialFragment_to_signUpFragment)
        }
    }

    // Login function, authorising and directing user with their credential info + role, post data to api/login
    private fun login() {
        val fullname = binding.fullnameEditText.text.toString()
        val password = binding.passwordEditText.text.toString()

        if (fullname.isEmpty() || password.isEmpty()) {
            Toast.makeText(context, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        val request = JSONObject().apply {
            put("fullname", fullname)
            put("password", password)
        }

        Log.d("LogIn", "Request: $request") // Debug logs

        val url = "http://10.0.2.2:3000/api/login"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.POST, url, request,
            Response.Listener { response ->
                val success = response.getBoolean("success")
                if (success) {
                    val user = response.getJSONObject("user")
                    val userId = user.getInt("id")
                    val roleId = user.getInt("role_id")
                    val bundle = Bundle().apply {
                        putInt("user_id", userId)
                    }
                    if (roleId == 1) {
                        findNavController().navigate(R.id.action_credentialFragment_to_userManagementFragment, bundle)
                    } else {
                        findNavController().navigate(R.id.action_credentialFragment_to_adminManagementFragment)
                    }
                } else {
                    Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Login failed", Toast.LENGTH_SHORT).show()
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