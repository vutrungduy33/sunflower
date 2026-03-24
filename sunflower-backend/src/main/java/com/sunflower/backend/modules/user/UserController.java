package com.sunflower.backend.modules.user;

import com.sunflower.backend.common.api.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ProfileDto> uploadMyAvatar(@RequestPart("avatar") MultipartFile avatar) {
        return ApiResponse.ok(userService.updateCurrentUserAvatar(avatar));
    }
}
