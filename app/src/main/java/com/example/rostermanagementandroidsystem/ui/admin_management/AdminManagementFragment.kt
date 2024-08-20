package com.example.rostermanagementandroidsystem.ui.admin_management

import android.app.DatePickerDialog
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.rostermanagementandroidsystem.databinding.FragmentAdminManagementBinding
import org.json.JSONArray
import org.json.JSONObject
import java.util.*
import androidx.navigation.fragment.findNavController


// Add imports for dialog contents
import android.app.AlertDialog
import androidx.core.content.ContextCompat
import com.example.rostermanagementandroidsystem.MainActivity

// Admin Management page, where manager can CRUD the staff shift card, implemented filtration function by staffname + datetime
class AdminManagementFragment : Fragment() {

    private var _binding: FragmentAdminManagementBinding? = null
    private val binding get() = _binding!!
    private var selectedFromDate: String? = null
    private var selectedToDate: String? = null
    private var userId: Int = -1

    // Initiate View (Read) function
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentAdminManagementBinding.inflate(inflater, container, false)
        return binding.root
    }

    // Show view components
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Retrieve user_id from arguments (configured in mobile_navigation.xml) or set a default value
        arguments?.let { bundle ->
            userId = bundle.getInt("user_id", -1)
            if (userId == -1) {
                Log.e("AdminManagementFragment", "User ID is not set")
                Toast.makeText(context, "User ID is not set", Toast.LENGTH_SHORT).show()
            }
        }

        setupDatePickers()
        fetchStaffNames()  // Fetch staff names first to populate the spinner

        // Ensure the FAB is visible only in this fragment
        (activity as? MainActivity)?.updateFabVisibility(true)
    }

    // Process to Profile page upon request, use hard-coded userId of value 1 (defaul Admin account)
    override fun onResume() {
        super.onResume()
        // For setting userId on Admin side's Profile page, which at default is 1
        userId = 1
        (activity as? MainActivity)?.binding?.appBarMain?.fab?.setOnClickListener {
            Log.d("User ID value", userId.toString())
            // Check if userId is valid before navigating
            if (userId != -1) {
                val action = AdminManagementFragmentDirections.actionAdminManagementFragmentToProfileFragment(userId)
                findNavController().navigate(action)
            } else {
                Log.e("AdminManagementFragment", "User ID is not valid")
                Toast.makeText(context, "User ID is not valid", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Set up date-dialog setter to set the specific time range for filtration implementation
    private fun setupDatePickers() {
        // Start date period
        binding.dateFromButton.setOnClickListener {
            showDatePickerDialog { date ->
                selectedFromDate = date
                binding.dateFromButton.text = date
                fetchShifts()  // Fetch shifts whenever date is changed
            }
        }

        // End date period
        binding.dateToButton.setOnClickListener {
            showDatePickerDialog { date ->
                selectedToDate = date
                binding.dateToButton.text = date
                fetchShifts()  // Fetch shifts whenever date is changed
            }
        }
    }

    // Date-dialog setter with corresponded datetime variables
    private fun showDatePickerDialog(onDateSet: (String) -> Unit) {
        val calendar = Calendar.getInstance()
        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH)
        val day = calendar.get(Calendar.DAY_OF_MONTH)

        val datePickerDialog = DatePickerDialog(requireContext(), { _, selectedYear, selectedMonth, selectedDay ->
            val date = "${selectedYear}-${selectedMonth + 1}-${selectedDay}"
            onDateSet(date)
        }, year, month, day)

        datePickerDialog.show()
    }

    // fetch shift cards filtrated by staff name + time range period, post + get data from api/shifts endpoint
    private fun fetchShifts() {
        val url = "http://10.0.2.2:3000/api/shifts"
        val params = HashMap<String, String>()
        selectedFromDate?.let { params["from_date"] = it }
        selectedToDate?.let { params["to_date"] = it }
        val selectedStaffName = binding.staffSpinner.selectedItem?.toString()
        selectedStaffName?.let { params["staff_name"] = it }

        val queryParams = params.map { "${it.key}=${it.value}" }.joinToString("&")
        val fullUrl = if (queryParams.isNotEmpty()) "$url?$queryParams" else url

        Log.d("FetchShifts", "URL: $fullUrl")

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.GET, fullUrl, null,
            Response.Listener { response ->
                Log.d("FetchShifts", "Response: $response")
                val success = response.getBoolean("success")
                if (success) {
                    val shifts = response.getJSONArray("shifts")
                    Log.d("FetchShifts", "Shifts: $shifts")
                    setupRecyclerView(shifts)
                } else {
                    val message = response.getString("message")
                    Log.e("FetchShifts", "Error message: $message")
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Log.e("FetchShifts", "Error: ${error.message}")
                Toast.makeText(context, "Failed to fetch shifts", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // Parse (Get) and Set staff name filtration, get api endpoint from api/accounts endpoint
    private fun fetchStaffNames() {
        val url = "http://10.0.2.2:3000/api/accounts"

        Log.d("FetchStaffNames", "URL: $url")

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.GET, url, null,
            Response.Listener { response ->
                Log.d("FetchStaffNames", "Response: $response")
                val success = response.getBoolean("success")
                if (success) {
                    val accounts = response.getJSONArray("accounts")
                    setupStaffSpinner(accounts)
                } else {
                    val message = response.getString("message")
                    Log.e("FetchStaffNames", "Error message: $message")
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Log.e("FetchStaffNames", "Error: ${error.message}")
                Toast.makeText(context, "Failed to fetch staff names", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    // Set up the spinner to roll across staffs' names
    private fun setupStaffSpinner(staff: JSONArray) {
        val staffNames = mutableListOf<String>()
        for (i in 0 until staff.length()) {
            val staffMember = staff.getJSONObject(i)
            staffNames.add(staffMember.getString("fullname"))
        }

        // Adapter array setting up set of staff objects
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, staffNames)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.staffSpinner.adapter = adapter

        binding.staffSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, position: Int, id: Long) {
                fetchShifts()  // Fetch shifts whenever a different staff member is selected
            }

            override fun onNothingSelected(parent: AdapterView<*>) {
                // Do nothing
            }
        }
    }

    // Set up setupRecyclerView extension
    private fun setupRecyclerView(shifts: JSONArray) {
        val visibleShifts = JSONArray()
        for (i in 0 until shifts.length()) {
            val shift = shifts.getJSONObject(i)
            val isHidden = if (shift.has("is_hidden") && !shift.isNull("is_hidden")) {
                shift.getInt("is_hidden")
            } else {
                0 // Default value if is_hidden is null or missing
            }
            if (isHidden == 0) {
                visibleShifts.put(shift)
            }
        }

        val recyclerView: RecyclerView = binding.recyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = ShiftsAdapter(visibleShifts, ::handleShiftAction)
    }

    // 1. Implement handleShiftAction method to handle "Edit Payment Status"
    // 2. Implement handleShiftAction method to handle "Hide" unused shift
    private fun handleShiftAction(action: String, shiftId: Int, shift: JSONObject) {
        when (action) {
            "editShift" -> {
                // Handle shift edit
            }
            "hideShift" -> {
                handleHideShift(shiftId, shift)
            }
            "updatePaymentStatus" -> {
                updatePaymentStatus(shiftId)
            }
        }
    }

    // Handle hide shift that already paid (set on payment_status), on action, send message
    private fun handleHideShift(shiftId: Int, shift: JSONObject) {
        val paymentStatus = shift.getInt("payment_status")
        if (paymentStatus == 0) {
            Toast.makeText(context, "This shift hasn't been paid, refuse to be hidden!", Toast.LENGTH_SHORT).show()
        } else {
            AlertDialog.Builder(requireContext())
                .setTitle("Hide Shift")
                .setMessage("Do you want to hide this shift card?")
                .setPositiveButton("Ok") { _, _ ->
                    updateIsHiddenField(shiftId, 1)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    // Update is_hidden data from the shift card at api/edit_shift endpoint
    private fun updateIsHiddenField(shiftId: Int, isHidden: Int) {
        val url = "http://10.0.2.2:3000/api/edit_shift"
        val requestBody = JSONObject().apply {
            put("shift_id", shiftId)
            put("is_hidden", isHidden)
        }

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.PUT, url, requestBody,
            Response.Listener { response ->
                Log.d("UpdateIsHiddenField", "Response: $response")
                val success = response.getBoolean("success")
                if (success) {
                    fetchShifts()
                } else {
                    val message = response.getString("message")
                    Log.e("UpdateIsHiddenField", "Error message: $message")
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Log.e("UpdateIsHiddenField", "Error: ${error.message}")
                Toast.makeText(context, "Failed to update is_hidden field", Toast.LENGTH_SHORT).show()
            }
        )

        Volley.newRequestQueue(context).add(jsonObjectRequest)
    }

    private fun updatePaymentStatus(shiftId: Int) {
        val url = "http://10.0.2.2:3000/api/edit_payment_status"
        val requestBody = JSONObject().apply {
            put("shift_id", shiftId)
        }

        val jsonObjectRequest = JsonObjectRequest(
            Request.Method.PUT, url, requestBody,
            Response.Listener { response ->
                Log.d("UpdatePaymentStatus", "Response: $response")
                val success = response.getBoolean("success")
                if (success) {
                    fetchShifts() // Refresh the shifts list
                } else {
                    val message = response.getString("message")
                    Log.e("UpdatePaymentStatus", "Error message: $message")
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                }
            },
            Response.ErrorListener { error ->
                error.printStackTrace()
                Log.e("UpdatePaymentStatus", "Error: ${error.message}")
                Toast.makeText(context, "Failed to update payment status", Toast.LENGTH_SHORT).show()
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
