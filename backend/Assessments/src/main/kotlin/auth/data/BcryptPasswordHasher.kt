package org.example.auth.data

import at.favre.lib.crypto.bcrypt.BCrypt
import org.example.auth.domain.PasswordHasher

class BcryptPasswordHasher : PasswordHasher {
    override fun verify(rawPassword: String, hash: String): Boolean =
        BCrypt.verifyer().verify(rawPassword.toCharArray(), hash).verified
}
