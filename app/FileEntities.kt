package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "starred_files")
data class StarredFileEntity(
    @PrimaryKey val path: String,
    val name: String,
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "file_tags", primaryKeys = ["path", "tag"])
data class FileTagEntity(
    val path: String,
    val tag: String,
    val colorHex: String = "#3B82F6"
)

@Entity(tableName = "trash_items")
data class TrashItemEntity(
    @PrimaryKey val trashPath: String, // Path inside trash folder
    val originalPath: String,
    val originalName: String,
    val size: Long,
    val isDirectory: Boolean,
    val deletedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "recent_files")
data class RecentFileEntity(
    @PrimaryKey val path: String,
    val name: String,
    val accessedAt: Long = System.currentTimeMillis()
)
