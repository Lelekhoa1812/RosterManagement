package com.example.rostermanagementandroidsystem.ui.user_management

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TimePicker
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.rostermanagementandroidsystem.MainActivity
import com.example.rostermanagementandroidsystem.R
import com.example.rostermanagementandroidsystem.databinding.FragmentUserManagementBinding
import com.example.rostermanagementandroidsystem.ui.admin_management.ShiftsAdapter
import org.json.JSONArray
import org.json.JSONObject
import com.example.rostermanagementandroidsystem.utils.addNoteToShift
import androidx.navigation.fragment.findNavController
import org.json.JSONException

// User Management page, where staff can start/end their shift with action and CRUD their shift card
class UserManagementFragment : Fragment() {

    private var _binding: FragmentUserManagementBinding? = null
    private val binding get() = _binding!!
    private var userId: Int = -1

    // Initiate View (Read) function
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentUserManagementBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Show view components (start/end) button + shift cards listing + fetching shift function
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Get user_id variable from argument configured in mobile_navigation.xml, set initially (default) at -1 indicating NULL
        arguments?.let { bundle ->
            userId = bundle.getInt("user_id", -1)
        }

        // Start shift button listener
        binding.startShiftButton.setOnClickListener {
            startShift()
        }

        // End shift button listener
        binding.endShiftButton.setOnClickListener {
            endShift()
        }

        fetchUserStatusAndShifts()
//        setupRecyclerView()
        fetchShifts()

        // Ensure the FAB is visible only in this fragment
        (activity as? MainActivity)?.updateFabVisibility(true)
    }

    // Process to Profile page upon request
    override fun onResume() {
        super.onResume()
        (activity as? MainActivity)?.binding?.appBarMain?.fab?.setOnClickListener {
            val action = UserManagementFragmentDirections.actionUserManagementFragmentToProfileFragment(userId)
            findNavController().navigate(action)
        }
    }

    // fetch user (by user_id) with their status (is_active) to be whether 0/1, hence, shows Start/End button accordingly, get data from /api/accounts/$userId endpoint
    private fun fetchUserStatusAndShifts() {
        if (userId == -1) {
            Toast.makeText(context, "User ID is not set", Toast.LENGTH_SHORT).show()
            return
        }

        val url = "http://10.0.2.2:3000/api/accounts/$userId"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.GET, url, null,
            Response.Listener { response ->
                Log.d("FetchUserStatus", "Response: $response")
                val success = response.getBoolean("success")
                if (success) {
                    val isActive = response.getJSONObject("account").getInt("is_active")
                    if (isActive == 1) {
                        binding.startShiftButton.visibility = View.GONE
                        binding.endShiftButton.visibility = View.VISIBLE
                    } else {
                        binding.startShiftButton.visibility = View.VISIBLE
                        binding.endShiftButton.visibility = View.GONE
                    }
                } else {
                    Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Failed to fetch user status", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // Start shift on button listener, initially set to corresponded user_id, apply changes onto the shift card with start/leave time data, posting to api/start_shift endpoint
    private fun startShift() {
        if (userId == -1) {
            Toast.makeText(context, "User ID is not set", Toast.LENGTH_SHORT).show()
            return
        }

        val request = JSONObject().apply {
            put("user_id", userId)
        }

        val url = "http://10.0.2.2:3000/api/start_shift"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.POST, url, request,
            Response.Listener { response ->
                try {
                    val success = response.getBoolean("success")
                    if (success) {
                        // Check if shift_id exists in the response
                        if (response.has("shift_id")) {
                            val shiftId = response.getInt("shift_id")
                            Log.d("Shift ID started", shiftId.toString())
                            Toast.makeText(context, "Shift started", Toast.LENGTH_SHORT).show()
                            fetchUserStatusAndShifts()
                            fetchShifts() // Refresh shift data
                        } else {
                            Log.e("Shift Start Error", "shift_id not found in the response")
                            Toast.makeText(context, "Failed to start shift. Shift ID missing.", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(context, "Failed to start shift", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: JSONException) {
                    e.printStackTrace()
                    Toast.makeText(context, "Failed to start shift. JSON parsing error.", Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Failed to start shift", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // End shift on button listener, initially set to corresponded user_id, apply changes onto the shift card with start/leave time data, posting to api/end_shift endpoint
    private fun endShift() {
        if (userId == -1) {
            Toast.makeText(context, "User ID is not set", Toast.LENGTH_SHORT).show()
            return
        }

        val request = JSONObject().apply {
            put("user_id", userId)
        }

        val url = "http://10.0.2.2:3000/api/end_shift"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.POST, url, request,
            Response.Listener { response ->
                val success = response.getBoolean("success")
                if (success) {
                    // No longer set Start/End button on click action as it relies on is_active status
                    Toast.makeText(context, "Shift ended", Toast.LENGTH_SHORT).show()
                    fetchUserStatusAndShifts()
                    fetchShifts() // Refresh shift data
                } else {
                    Toast.makeText(context, "Failed to end shift", Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Failed to end shift", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // fetch the shift matching (filtered by) user_id, get data from api/shifts endpoint
    private fun fetchShifts() {
        if (userId == -1) {
            Toast.makeText(context, "User ID is not set", Toast.LENGTH_SHORT).show()
            return
        }

        val url = "http://10.0.2.2:3000/api/shifts"

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.GET, url, null,
            Response.Listener { response ->
                Log.d("FetchShifts", "Response: $response")
                val success = response.getBoolean("success")
                if (success) {
                    val shifts = response.getJSONArray("shifts")
                    val filteredShifts = JSONArray()
                    for (i in 0 until shifts.length()) {
                        val shift = shifts.getJSONObject(i)
                        if (shift.getInt("user_id") == userId && shift.getInt("payment_status") == 0) {
                            filteredShifts.put(shift)
                        }
                    }
                    Log.d("FetchShifts", "Filtered Shifts: $filteredShifts")
                    setupRecyclerView(filteredShifts)
                } else {
                    Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Toast.makeText(context, "Failed to fetch shifts", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // Show shift cards
    private fun setupRecyclerView(shifts: JSONArray) {
        val recyclerView: RecyclerView = binding.recyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = ShiftsAdapter(shifts, ::handleShiftAction, showEditPaymentStatus = false, isAdmin = false,)
    }

    // Handle edit and note, populate to the shift card on action
    private fun handleShiftAction(action: String, shiftId: Int, shift: JSONObject) {
        // Handle shift actions like editShift, noteShift
        when (action) {
            "editShift" -> editShift(shiftId, shift)
            "noteShift" -> showNoteDialog(shiftId)
            // Handle other actions if needed
        }
    }

    // Construct template of note dialog for View, showing edit and submit button
    private fun showNoteDialog(shiftId: Int) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_add_note, null)
        val noteEditText = dialogView.findViewById<EditText>(R.id.etNote)
        val submitButton = dialogView.findViewById<Button>(R.id.btnSubmitNote)

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Add Note")
            .setView(dialogView)
            .create()

        submitButton.setOnClickListener {
            val note = noteEditText.text.toString().trim()
            if (note.isNotEmpty()) {
                if (note.length > 30) {
                    // Notify user if note exceeds 30 characters
                    Toast.makeText(context, "Note cannot exceed 30 characters", Toast.LENGTH_SHORT).show()
                } else {
                    addNoteToShift(requireContext(), shiftId, note, {
                        Log.d("AddNote", "Note added successfully")
                        // Update UI or notify adapter
                    }, {
                        Log.e("AddNote", "Failed to add note")
                    })
                    dialog.dismiss()
                }
            } else {
                Toast.makeText(context, "Note cannot be empty", Toast.LENGTH_SHORT).show()
            }
        }

        dialog.show()
    }

    // Handle edit shift timing to allow user manually update their shift time (if needed), set the TimePicker dialog on request to handle time input form
    private fun editShift(shiftId: Int, shift: JSONObject) {
        // Do nothing
    }

    // Destructor
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
