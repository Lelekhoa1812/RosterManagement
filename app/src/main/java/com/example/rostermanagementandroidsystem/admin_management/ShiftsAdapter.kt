package com.example.rostermanagementandroidsystem.admin_management

// import dialog libraries
import android.app.AlertDialog
import android.content.Context
import android.content.DialogInterface

import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.TimePicker
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.rostermanagementandroidsystem.R
import com.example.rostermanagementandroidsystem.databinding.ShiftItemBinding
import org.json.JSONArray
import org.json.JSONObject
import com.example.rostermanagementandroidsystem.utils.addNoteToShift
import kotlin.reflect.KFunction3

// Adapt shift card with any changes
class ShiftsAdapter(
    private val shifts: JSONArray,
    private val onShiftAction: KFunction3<String, Int, JSONObject, Unit>,
    private val showEditPaymentStatus: Boolean = true,
    private val isAdmin: Boolean = true
) : RecyclerView.Adapter<ShiftsAdapter.ShiftViewHolder>() {


    // Create View
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ShiftViewHolder {
        val binding = ShiftItemBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ShiftViewHolder(binding)
    }

    // Binding view with ShiftViewHolder function
    override fun onBindViewHolder(holder: ShiftViewHolder, position: Int) {
        val shift = shifts.getJSONObject(position)
        holder.bind(shift)
        // other logics
    }

    // Count the total number of shift card
    override fun getItemCount() = shifts.length()

    // Populate Shift card with function handling 'Edit Payment Status' and 'Hide/Note' button display
    inner class ShiftViewHolder(private val binding: ShiftItemBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(shift: JSONObject) {
            binding.tvShiftDetails.text = formatShiftDetails(shift)
            // Show or hide note based on its existence
            val note = shift.optString("note", "N/A")
            // if note from that shift card is not null, bind the note data and display
            Log.d("Note content", note) // Debugs
            // Somehow note is set to null as string here :/
            if (note == "null" || note.isEmpty()) {
                binding.tvShiftNote.visibility = View.GONE
            } else {
                binding.tvShiftNote.text = "Note: $note"
                binding.tvShiftNote.visibility = View.VISIBLE
            }
            // Other binding logic if needed

            // Set "Edit Payment Status" and "Hide" shift cards function
            if (showEditPaymentStatus) {
                binding.editPaymentStatus.visibility = View.VISIBLE
                binding.editPaymentStatus.setOnClickListener { showPaymentStatusDialog(binding.root.context, shift) }
                val paymentStatus = shift.optInt("payment_status", 0)
                binding.editPaymentStatus.text = if (paymentStatus == 1) "Paid" else "Not Paid"
                binding.editPaymentStatus.setBackgroundColor(ContextCompat.getColor(binding.root.context, if (paymentStatus == 1) R.color.teal_200 else R.color.red))
            } else {
                binding.editPaymentStatus.visibility = View.GONE
            }

            // Admin and User logic
            if (isAdmin) {
                binding.hideShift.visibility = View.VISIBLE
                binding.noteShift.visibility = View.GONE
//                binding.hideShift.setOnClickListener { onShiftAction("hideShift", shift.getInt("id")) }
                binding.hideShift.setOnClickListener { onShiftAction("hideShift", shift.getInt("id"), shift) }
                binding.editShift.setOnClickListener { showEditShiftDialog(binding.root.context, shift, adapterPosition) }
            } else {
                binding.hideShift.visibility = View.GONE
                binding.noteShift.visibility = View.VISIBLE
//                binding.noteShift.setOnClickListener { onShiftAction("noteShift", shift.getInt("id")) }
                binding.noteShift.setOnClickListener { showAddNoteDialog(binding.root.context, shift) }
                binding.editShift.setOnClickListener { showEditShiftDialog(binding.root.context, shift, adapterPosition) }
            }
        }
    }

    // format shift card with details as data initiated
    private fun formatShiftDetails(shift: JSONObject): String {
        val fullname = shift.optString("fullname", "Unknown")
        val signIn = shift.optString("sign_in", "N/A")
        val signOut = shift.optString("sign_out", "N/A")
        val totalHour = shift.optDouble("total_hour", 0.0)
        val paymentStatus = if (shift.optInt("payment_status", 0) == 1) "Paid" else "Not Paid"
        return "Fullname: $fullname\n$signIn - $signOut\nTotal: $totalHour hours\nPayment Status: $paymentStatus"
    }

    // Get and Set payment status from payment_status field of the shift card
    private fun showPaymentStatusDialog(context: Context, shift: JSONObject) {
        val paymentStatus = shift.optInt("payment_status", 0)
        val message = if (paymentStatus == 1) {
            "Do you want to set this shift card to Not Paid?"
        } else {
            "Do you want to set this shift card to Paid?"
        }

        AlertDialog.Builder(context)
            .setTitle("Confirm Change")
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ ->
                val newStatus = if (paymentStatus == 1) 0 else 1
//                onShiftAction("updatePaymentStatus", shift.getInt("id"))
                onShiftAction("updatePaymentStatus", shift.getInt("id"), shift)
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ -> dialog.dismiss() }
            .create()
            .show()
    }

    // Construct add note dialog view
    private fun showAddNoteDialog(context: Context, shift: JSONObject) {
        val shiftId = shift.getInt("id")
        val editText = EditText(context).apply {
            hint = "Enter your note here"
        }

        AlertDialog.Builder(context)
            .setTitle("Add Note")
            .setView(editText)
            .setPositiveButton("Add") { dialog, _ ->
                val note = editText.text.toString()
                addNoteToShift(context, shiftId, note, {
                    Log.d("AddNote", "Note added successfully")
                    // Update UI or notify adapter
                }, {
                    Log.e("AddNote", "Failed to add note")
                })
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ -> dialog.dismiss() }
            .create()
            .show()
    }

    // Construct edit shift dialog view, update (put) new time data to api/edit_time endpoint
    private fun showEditShiftDialog(context: Context, shift: JSONObject, position: Int) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.timepicker, null)
        val timePickerSignIn = dialogView.findViewById<TimePicker>(R.id.timePickerSignIn)
        val timePickerSignOut = dialogView.findViewById<TimePicker>(R.id.timePickerSignOut)

        timePickerSignIn.setIs24HourView(true)
        timePickerSignOut.setIs24HourView(true)

        AlertDialog.Builder(context)
            .setTitle("Edit Shift")
            .setView(dialogView)
            .setPositiveButton("Set") { _, _ ->
                val signInHour = timePickerSignIn.hour
                val signInMinute = timePickerSignIn.minute
                val signOutHour = timePickerSignOut.hour
                val signOutMinute = timePickerSignOut.minute

                val signInTime = String.format("%02d:%02d:00", signInHour, signInMinute)
                val signOutTime = String.format("%02d:%02d:00", signOutHour, signOutMinute)

                // Create a new JSONObject for the request body
                val updatedShift = JSONObject().apply {
                    put("shift_id", shift.getInt("id"))  // Change to "shift_id"
                    put("sign_in", signInTime)
                    put("sign_out", signOutTime)
                }

                val url = "http://10.0.2.2:3000/api/edit_time"

                val jsonObjectRequest = JsonObjectRequest(
                    Request.Method.POST, url, updatedShift,
                    Response.Listener { response ->
                        Log.d("EditShift", "Response: $response")
                        val success = response.getBoolean("success")
                        if (success) {
                            Toast.makeText(context, "Shift edited successfully", Toast.LENGTH_SHORT).show()
                            // Update the local shift object with the new times
                            shift.put("sign_in", signInTime)
                            shift.put("sign_out", signOutTime)
                            notifyItemChanged(position) // Refresh the item in RecyclerView
                        } else {
                            Toast.makeText(context, response.getString("message"), Toast.LENGTH_SHORT).show()
                        }
                    },
                    Response.ErrorListener { error ->
                        error.printStackTrace()
                        Toast.makeText(context, "Failed to edit shift", Toast.LENGTH_SHORT).show()
                    }
                )

                Volley.newRequestQueue(context).add(jsonObjectRequest)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
