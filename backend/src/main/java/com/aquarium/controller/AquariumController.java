package com.aquarium.controller;

import com.aquarium.domain.ContributionDay;
import com.aquarium.security.OAuth2TokenExtractor;
import com.aquarium.service.GitHubGraphQLService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AquariumController {

    private final GitHubGraphQLService graphQLService;
    private final OAuth2TokenExtractor tokenExtractor;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        OAuth2User user = (OAuth2User) authentication.getPrincipal();
        Integer publicRepos = user.getAttribute("public_repos");
        Integer followers   = user.getAttribute("followers");
        return Map.of(
            "login",       user.getAttribute("login"),
            "avatar",      user.getAttribute("avatar_url"),
            "name",        user.getAttribute("name") != null ? user.getAttribute("name") : user.getAttribute("login"),
            "publicRepos", publicRepos != null ? publicRepos : 0,
            "followers",   followers   != null ? followers   : 0
        );
    }

    @GetMapping("/contributions")
    public Map<String, Object> contributions(Authentication authentication) {
        String token = tokenExtractor.extractToken(authentication);
        List<ContributionDay> days = graphQLService.getContributions(token);
        int total = days.stream().mapToInt(ContributionDay::getCount).sum();

        return Map.of(
            "days",  days,
            "total", total
        );
    }
}
