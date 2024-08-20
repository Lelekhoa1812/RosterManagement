import androidx.lifecycle.LiveData
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface ShiftDao {
    @Insert
    suspend fun insert(shift: ShiftEntity)

    @Query("SELECT * FROM shifts WHERE id = :id")
    fun getShiftById(id: Int): LiveData<ShiftEntity>

    @Query("SELECT * FROM shifts")
    fun getAllShifts(): LiveData<List<ShiftEntity>>

    @Update
    suspend fun update(shift: ShiftEntity)

    @Query("DELETE FROM shifts WHERE id = :id")
    suspend fun deleteById(id: Int)
}
