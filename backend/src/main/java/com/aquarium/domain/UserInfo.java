package com.aquarium.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserInfo {
    private String login;
    private String avatarUrl;
    private String name;
    private int publicRepos;
    private int followers;
}
