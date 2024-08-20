package com.example.rostermanagementandroidsystem.ui.business_signin

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.rostermanagementandroidsystem.R
import com.example.rostermanagementandroidsystem.databinding.FragmentBusinessSignInBinding
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException

class BusinessSignInFragment : Fragment() {

    private var _binding: FragmentBusinessSignInBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBusinessSignInBinding.inflate(inflater, container, false)
        val view = binding.root

        binding.signupLink.setOnClickListener {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("http://localhost:3000/?#"))
            startActivity(browserIntent)
        }

        binding.submitButton.setOnClickListener {
            val inputCode = binding.businessCodeInput.text.toString().trim()
            if (inputCode.isNotEmpty()) {
                checkBusinessCode(inputCode)
            } else {
                Toast.makeText(requireContext(), "Please enter a business code", Toast.LENGTH_SHORT).show()
            }
        }

        return view
    }

    private fun checkBusinessCode(inputCode: String) {
        val client = OkHttpClient()

        // Correct way to create MediaType
        val mediaType = "application/json".toMediaTypeOrNull()

        val requestBody = RequestBody.create(mediaType, "{\"code\":\"$inputCode\"}")
        val request = Request.Builder()
            .url("http://10.0.2.2:3000/api/fetch_business_code")
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                activity?.runOnUiThread {
                    Toast.makeText(requireContext(), "Error connecting to the server", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    val responseData = response.body?.string()
                    val json = JSONObject(responseData ?: "")
                    val isValid = json.getBoolean("valid")

                    activity?.runOnUiThread {
                        if (isValid) {
                            val bundle = Bundle().apply {
                                putString("business_code", inputCode)
                            }
                            findNavController().navigate(R.id.action_businessSignInFragment_to_credentialFragment, bundle)
                        } else {
                            Toast.makeText(requireContext(), "Invalid business code", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    activity?.runOnUiThread {
                        Toast.makeText(requireContext(), "Server returned an error", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
