package com.sunflower.backend.modules.user;

import com.sunflower.backend.common.api.ApiResponse;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<ProfileDto> getMyProfile() {
        return ApiResponse.ok(userService.getCurrentProfile());
    }

    @PatchMapping("/me")
    public ApiResponse<ProfileDto> patchMyProfile(@RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userService.updateCurrentProfile(request));
    }
}
