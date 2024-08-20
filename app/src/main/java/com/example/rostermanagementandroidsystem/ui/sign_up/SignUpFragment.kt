package com.example.rostermanagementandroidsystem.ui.sign_up

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.rostermanagementandroidsystem.databinding.FragmentSignUpBinding
import org.json.JSONObject
import com.example.rostermanagementandroidsystem.R

// Signup set up, setter user's credential information and role (only user)
class SignUpFragment : Fragment() {

    private var _binding: FragmentSignUpBinding? = null
    private val binding get() = _binding!!

    // Create View
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentSignUpBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Set up
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.submitButton.setOnClickListener {
            signUp()
        }

        binding.loginLink.setOnClickListener {
            findNavController().navigate(R.id.action_signUpFragment_to_credentialFragment)
        }
    }

    // Signup funtion, post credential data to the db via api/signup endpoint
    private fun signUp() {
        val fullname = binding.nameEditText.text.toString()
        val password = binding.pinEditText.text.toString()

        if (fullname.isEmpty() || password.isEmpty()) {
            Toast.makeText(context, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        val request = JSONObject().apply {
            put("fullname", fullname) // Adjusted field name to match database schema
            put("password", password) // Adjusted field name to match database schema
        }

        Log.d("SignUp", "Request: $request") // Debug logs

        val url = "http://10.0.2.2:3000/api/signup"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.POST, url, request,
            Response.Listener { response ->
                Log.d("SignUp", "Response: $response") // Debug logs
                val success = response.getBoolean("success")
                if (success) {
                    Toast.makeText(context, "Sign up successful", Toast.LENGTH_SHORT).show()
                    findNavController().navigate(R.id.action_signUpFragment_to_credentialFragment)
                } else {
                    Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                Log.e("SignUp", "Error: ${error.message}") // Debug logs
                error.printStackTrace()
                Toast.makeText(context, "Sign up failed", Toast.LENGTH_SHORT).show()
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
