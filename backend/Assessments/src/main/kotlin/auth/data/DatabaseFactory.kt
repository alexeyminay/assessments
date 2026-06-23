package org.example.auth.data

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database

object DatabaseFactory {

    fun init() {
        val config = HikariConfig().apply {
            jdbcUrl = System.getenv("DB_URL") ?: "jdbc:postgresql://localhost:5432/assessments"
            driverClassName = "org.postgresql.Driver"
            username = System.getenv("DB_USER") ?: "admin"
            password = System.getenv("DB_PASSWORD") ?: "admin"
            maximumPoolSize = 80
        }
        val dataSource = HikariDataSource(config)

        Flyway.configure()
            .dataSource(dataSource)
            .baselineOnMigrate(true)
            .baselineVersion("0")
            .load()
            .migrate()

        Database.connect(dataSource)
    }
}
