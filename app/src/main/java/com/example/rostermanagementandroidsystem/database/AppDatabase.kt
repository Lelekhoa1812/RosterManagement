package com.example.rostermanagementandroidsystem.database

import AccountDao
import AccountEntity
import AppDatabaseCallback
import RoleDao
import RoleEntity
import ShiftDao
import ShiftEntity
import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [RoleEntity::class, AccountEntity::class, ShiftEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun roleDao(): RoleDao
    abstract fun accountDao(): AccountDao
    abstract fun shiftDao(): ShiftDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "roster_management_database"

                )
                .addCallback(AppDatabaseCallback()) // Add the callback here
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
