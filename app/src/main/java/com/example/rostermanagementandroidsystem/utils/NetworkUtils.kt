package com.example.rostermanagementandroidsystem.utils

import android.content.Context
import android.util.Log
import android.widget.Toast
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import org.json.JSONObject

// Construct and send put request on new note created to the specific shift card (on shift_id) on api/add_note endpoint
fun addNoteToShift(context: Context, shiftId: Int, note: String, onSuccess: () -> Unit, onError: () -> Unit) {
    val url = "http://10.0.2.2:3000/api/add_note"
    val requestQueue: RequestQueue = Volley.newRequestQueue(context)
    val jsonObject = JSONObject().apply {
        put("id", shiftId)
        put("note", note)
    }

    val request = JsonObjectRequest(
        Request.Method.POST, url, jsonObject,
        { response ->
            Log.d("AddNote", "Note added successfully: $response")
            onSuccess()
        },
        { error ->
            Log.e("AddNote", "Failed to add note: ${error.message}")
            Toast.makeText(context, "Failed to add note. Please try again later.", Toast.LENGTH_SHORT).show()
            onError()
        }
    )

    requestQueue.add(request)
}

