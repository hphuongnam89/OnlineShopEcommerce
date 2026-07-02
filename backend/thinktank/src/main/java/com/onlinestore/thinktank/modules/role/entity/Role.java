package com.onlinestore.thinktank.modules.role.entity;

import com.onlinestore.thinktank.common.entity.BaseEntity;
import com.onlinestore.thinktank.modules.permission.entity.Permission;
import com.onlinestore.thinktank.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "roles",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "name")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Role extends BaseEntity {

    // Security role assigned to users for authorization checks.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            nullable = false,
            unique = true,
            length = 100
    )
    private String name;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns =
            @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions =
            new HashSet<>();

    @ManyToMany(mappedBy = "roles")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<User> users =
            new HashSet<>();
}
