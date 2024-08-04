import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "shifts")
data class ShiftEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "user_id") val userId: Int?,
    @ColumnInfo(name = "fullname") val fullname: String?,
    @ColumnInfo(name = "sign_in") val signIn: String?,
    @ColumnInfo(name = "sign_out") val signOut: String?,
    @ColumnInfo(name = "total_hour") val totalHour: Float?,
    @ColumnInfo(name = "payment_status") val paymentStatus: Boolean = false,
    @ColumnInfo(name = "is_hidden") val isHidden: Boolean = false,
    @ColumnInfo(name = "note") val note: String?
)
