import androidx.lifecycle.LiveData
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface RoleDao {
    @Insert
    suspend fun insert(role: RoleEntity)

    @Query("SELECT * FROM roles")
    fun getAllRoles(): LiveData<List<RoleEntity>>
}
