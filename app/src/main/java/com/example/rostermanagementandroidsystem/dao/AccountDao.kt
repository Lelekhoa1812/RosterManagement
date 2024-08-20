import androidx.lifecycle.LiveData
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface AccountDao {
    @Insert
    suspend fun insert(account: AccountEntity)

    @Query("SELECT * FROM accounts WHERE id = :id")
    fun getAccountById(id: Int): LiveData<AccountEntity>

    @Query("SELECT * FROM accounts")
    fun getAllAccounts(): LiveData<List<AccountEntity>>

    @Update
    suspend fun update(account: AccountEntity)
}
