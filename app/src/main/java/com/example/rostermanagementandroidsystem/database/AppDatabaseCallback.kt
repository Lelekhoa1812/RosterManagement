import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase

class AppDatabaseCallback : RoomDatabase.Callback() {
    override fun onCreate(db: SupportSQLiteDatabase) {
        super.onCreate(db)
        // Execute SQL commands to insert initial data
        db.execSQL("INSERT INTO roles (name) VALUES ('user'), ('admin')")
        db.execSQL("INSERT INTO accounts (fullname, password, role_id, is_active) VALUES ('Admin', '1234', 2, 0)")
    }
}
