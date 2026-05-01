package com.aquarium.service;

import com.aquarium.domain.ContributionDay;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GitHubGraphQLService {

    private final RestTemplate restTemplate;

    private static final String GRAPHQL_URL = "https://api.github.com/graphql";

    private static final String QUERY = """
        {
          viewer {
            login
            avatarUrl
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
        """;

    public List<ContributionDay> getContributions(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("query", QUERY);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            GRAPHQL_URL, HttpMethod.POST, request, Map.class
        );

        return parseContributions(response.getBody());
    }

    @SuppressWarnings("unchecked")
    private List<ContributionDay> parseContributions(Map<String, Object> body) {
        Map<String, Object> data       = (Map<String, Object>) body.get("data");
        Map<String, Object> viewer     = (Map<String, Object>) data.get("viewer");
        Map<String, Object> collection = (Map<String, Object>) viewer.get("contributionsCollection");
        Map<String, Object> calendar   = (Map<String, Object>) collection.get("contributionCalendar");
        List<Map<String, Object>> weeks = (List<Map<String, Object>>) calendar.get("weeks");

        return weeks.stream()
            .flatMap(week -> {
                List<Map<String, Object>> days = (List<Map<String, Object>>) week.get("contributionDays");
                return days.stream();
            })
            .map(day -> new ContributionDay(
                (String) day.get("date"),
                (Integer) day.get("contributionCount")
            ))
            .collect(Collectors.toList());
    }
}
