import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "fullname") val fullname: String,
    @ColumnInfo(name = "password") val password: String,
    @ColumnInfo(name = "role_id") val roleId: Int?,
    @ColumnInfo(name = "is_active") val isActive: Boolean = false
)
