function forceLowerCase(formField) {
  formField.value = formField.value.toLowerCase();
}

$(document).ready(function () {
  handleFormSubmitBlocking();
  handleOpeningPDF();
  handleEmailLoginWidget();
  handlePhoneLoginWidget();
  showYoutubeWidgetsIfReachableOnNetwork();
  handleCodesOnClick();
  handleModalWindow();
  togglePrettyTermsCheckbox();
  handleAgreements();
  handlePreloginCountdown();
  handlePhoneInput("#id_phone_number", "#phone-login-form");
  handlePhoneLoginProcess();
  handleLegacyAgreements();
  handleDefaultSvgFillColor();

  function handleDefaultSvgFillColor() {
    var loginPage = $("#login-page");
    if (loginPage.length > 0) {
      var paths = $("#login-page svg path");
      if (paths.length > 0) {
        paths.each(function (index, path) {
          var p = $(path);
          var parent = p.parent();
          var color = parent.css("color");
          p.attr("fill", color);
        });
      }
    }
  }

  function handleLegacyAgreements() {
    var legacyWidget = $("#legacy-agreements");
    if (legacyWidget.length > 0) {
      addCheckboxes();
      setState();
      legacyWidget.find("p").click(function () {
        var checkbox = $(this).find('input[type="checkbox"]');
        if (checkbox.is(":checked")) {
          checkbox.removeAttr("checked");
        } else {
          checkbox.attr("checked", "checked");
        }
        setState();
      });
      legacyWidget.find("span").click(function () {
        var paragraph = $(this).parent();
        if (paragraph.hasClass("hide-text")) {
          paragraph.removeClass("hide-text");
          $(this).html("&uarr;");
        } else {
          paragraph.addClass("hide-text");
          $(this).html("&darr;");
        }
        return false;
      });
    }

    function addCheckboxes() {
      var widget = $('<input type="checkbox">');
      var textExpander = $("<span>&darr;</span>");
      var agreements = $("#legacy-agreements p");
      agreements.each(function (index, agreement) {
        var checkbox = widget.clone();
        var expander = textExpander.clone();
        $(agreement).prepend(checkbox);
        $(agreement).append(expander);
      });
    }

    function setState() {
      var checkboxes = legacyWidget.find('input[type="checkbox"]');
      var checked = checkboxes.not(":checked").length === 0;
      if (checked) {
        $("widget-wrapper").removeClass("disabled-widget");
      } else {
        $("widget-wrapper").addClass("disabled-widget");
      }
    }
  }
  function handlePhoneLoginProcess() {
    var form = $("#phone-login-form");
    var firstPart = $(".first-part");
    var secondPart = $(".second-part");
    var checkButton = $("#check-phone-number");
    var phoneNumber = $("#id_phone_number");
    var confirmationCodeField = $("#id_confirmation_code");
    var hasEerrors = form.data("has-errors");
    var clearButton = $("#clear-form");
    if (phoneNumber.val()) {
      secondPart.show();
    }
    if (!hasEerrors) {
      firstPart.show();
      secondPart.hide();
    } else {
      firstPart.hide();
      secondPart.show();
    }
    checkButton.click(function () {
      var numberInput = $("#id_phone_number");
      if (numberInput.intlTelInput("isValidNumber")) {
        phoneNumber.removeClass("invalid-number");
        var number = numberInput.intlTelInput("getNumber");
        sendCheckRequest(number, handleValidationResponse, handleErrorResponse);
      } else {
        phoneNumber.addClass("invalid-number");
      }
    });
    clearButton.click(function () {
      phoneNumber.val("");
      confirmationCodeField.val("");
      firstPart.show();
      secondPart.hide();
    });

    function sendCheckRequest(number, callback, errorCallback) {
      var url = form.data("number-validation-url");
      $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        data: { number: number },
      })
        .done(callback)
        .fail(errorCallback);
    }
    function handleValidationResponse(data) {
      var status = data.status;
      $("#declaration_id").val(data.id);
      if (status === "confirmation_sent") {
        switchToConfirmationCodeField();
      } else if (
        status === "confirmed" ||
        status === "confirmation_not_required"
      ) {
        submitForm();
      }

      function switchToConfirmationCodeField() {
        firstPart.hide();
        secondPart.show();
      }
      function submitForm() {
        confirmationCodeField.val("****");
        $("#phone-login-form").submit();
      }
    }
    function handleErrorResponse(jqXHR) {
      var errorLabels = $("#phone-form-errors");
      if (jqXHR.responseJSON.status === "usage_limit_reached") {
        alert(errorLabels.data("limit-reached-label"));
      } else if (jqXHR.responseJSON.status === "invalid_phone_number") {
        alert(errorLabels.data("invalid-phone-label"));
      } else {
        alert(errorLabels.data("error-label"));
      }
    }
  }

  function handlePhoneInput(inputSelector, formSelector, allowBlank) {
    var input = $(inputSelector);
    var dialCodeMaxLength = 4;
    if (input.length > 0) {
      var form = $(formSelector);
      var utils = form.data("utils-script");
      var initialCountry = form.data("country-code");
      if (!initialCountry) {
        initialCountry = "us";
      }
      var phoneField = $(inputSelector);
      phoneField.intlTelInput({
        utilsScript: utils,
        autoPlaceholder: true,
        initialCountry: initialCountry,
        preferredCountries: ["us", "gb", "fr", "ru", "pl"],
      });
      var currentRawValue = $(inputSelector)[0].value;
      if (currentRawValue.length <= dialCodeMaxLength) {
        setCurrentDialCode();
      }
      phoneField.on("countrychange", function (e) {
        setCurrentDialCode();
      });
      $(formSelector).submit(function () {
        var phone = $(inputSelector).intlTelInput("getNumber");
        if (allowBlank && phone.length <= dialCodeMaxLength) {
          $(inputSelector).val("");
        } else {
          $(inputSelector).val(phone);
        }
      });
    }
    function setCurrentDialCode() {
      var dialCode = phoneField.intlTelInput("getSelectedCountryData").dialCode;
      if (dialCode) {
        phoneField.val("+" + dialCode.toString());
      }
    }
  }
  function handlePreloginCountdown() {
    var widget = $("#prelogin-navbar input");
    var delay = widget.data("delay");
    var label = widget.data("label");
    if (delay > 0) {
      widget.attr("disabled", "disabled");
      var timer = setInterval(decrementCountdown, 1000);
    }
    function decrementCountdown() {
      var current = parseInt(widget.data("delay"));
      if (current > 0) {
        var next = current - 1;
        widget.val(next.toString() + "...");
        widget.data("delay", next);
      } else {
        widget.val(label);
        widget.removeAttr("disabled");
        widget.addClass("internet-button");
        widget.removeClass("inactive-internet-button");
        window.clearInterval(timer);
      }
    }
  }
  function handleFormSubmitBlocking() {
    var forms = $("form");
    var buttons = $("form button, input[type=submit]");

    window.onunload = clearLock;
    clearLock();
    enableEvents();
    function enableEvents() {
      forms.submit(lockForm);
      buttons.submit(animateButton);
    }
    function lockForm() {
      var form = $(this);
      if (form.hasClass("submitted")) {
        return false;
      } else {
        form.addClass("submitted");
        form.find("button, input[type=submit]").addClass("clicked");
      }
    }
    function animateButton() {
      $(this).addClass("clicked");
    }
    function clearLock() {
      forms.removeClass("submitted");
      buttons.removeClass("clicked");
    }
  }
  function handleOpeningPDF() {
    $("#agreement-click a, #agreement-checkbox a").click(function () {
      var reader = $("#pdfReader");
      reader.toggle();
    });
  }
  function handlePhoneLoginWidget() {
    var bundleButton = $("#bundle-phone-button");
    var bundleForm = $("#phone-login-form");
    bundleButton.click(function () {
      var phoneButton = $(this);
      if (bundleForm.is(":hidden")) {
        bundleForm.css("display", "block");
        phoneButton.css("opacity", 0.5);
        bundleForm.find("input[type=tel]").focus();
        document.getElementById("id_phone_number").scrollIntoView();
      } else {
        bundleForm.hide();
        phoneButton.css("opacity", 1);
      }
      return false;
    });
    var singleButton = $("#phone-login-button");
    var singleForm = $("#phone-login-form");
    singleButton.click(function () {
      var emailButton = $(this);
      if (singleForm.is(":hidden")) {
        singleForm.css("display", "block");
        singleForm.find("input[type=tel]").focus();
        document.getElementById("id_phone_number").scrollIntoView();
        emailButton.hide();
      }
      return false;
    });
  }
  function handleEmailLoginWidget() {
    var bundleButton = $("#bundle-email-button");
    var bundleForm = $("#bundle-email-form");
    if (bundleForm.length > 0) {
      handlePhoneInput("#id_email_phone", "#bundle-email-form", true);
    }
    bundleButton.click(function () {
      var emailButton = $(this);
      if (bundleForm.is(":hidden")) {
        bundleForm.css("display", "block");
        emailButton.css("opacity", 0.5);
        bundleForm.find("input[type=email]").focus();
        document.getElementById("id_email").scrollIntoView();
      } else {
        bundleForm.hide();
        emailButton.css("opacity", 1);
      }
      return false;
    });
    var singleButton = $("#email-login-button");
    var singleForm = $("#email-login-form");
    if (singleForm.length > 0) {
      handlePhoneInput("#id_email_phone", "#email-login-form", true);
    }
    singleButton.click(function () {
      var emailButton = $(this);
      if (singleForm.is(":hidden")) {
        singleForm.css("display", "block");
        singleForm.find("input[type=email]").focus();
        document.getElementById("id_email").scrollIntoView();
        emailButton.hide();
      }
      return false;
    });
  }
  function showYoutubeWidgetsIfReachableOnNetwork() {
    var wrapper = $(".video-wrapper");
    if (wrapper.length > 0) {
      var videoId = wrapper.data("video-id");
      var videoIconUrl = "https://img.youtube.com/vi/" + videoId + "/0.jpg";
      var img = document.body.appendChild(document.createElement("img"));
      img.onload = function () {
        var videos = $(".video-wrapper");
        videos.show();
        img.remove();
      };
      img.onerror = function () {
        img.remove();
      };
      img.src = videoIconUrl;
    }
  }
  function handleCodesOnClick() {
    $("#login-codes-button").click(function () {
      var codeButton = $(this);
      var codeForm = $("#code-form");
      if (codeForm.is(":hidden")) {
        codeForm.css("display", "flex");
        codeButton.hide();
      }
      return false;
    });
  }
  function handleModalWindow() {
    $(".link-footer").click(openModal);
    $(".iframe-close").click(closeModal);

    function openModal() {
      var contentUrl = $(this).data("url");
      var iframeModal = $(".iframe-modal");
      iframeModal.show();
      var iframe = $("#iframe");
      iframe.attr("src", contentUrl);
    }
    function closeModal() {
      var iframeModal = $(".iframe-modal");
      iframeModal.hide();
    }
  }
  function togglePrettyTermsCheckbox() {
    $(".cbx").click(function () {
      var sexyCheckbox = $(".inp-cbx");
      var submitButton = $("#simple_login_submit");
      submitButton.attr("disabled", sexyCheckbox.prop("checked"));
    });
  }
  function handleAgreements() {
    var slider = $("#agreement-slider");
    var button = $("#agreement-submit");
    if (slider.length == 0 && button.length == 0) {
      return;
    }
    var notAgree = $("#not-agreed-link");
    var notAgreeButton = $("#dont-want-stay");
    var agreementForm = $("#agreement-form");
    slider.on("input", onAgreementSliderInput);
    slider.change(onAgreementSliderChange);
    notAgree.click(submitAgreements);
    agreementForm.submit(submitWithButton);
    notAgreeButton.click(submitAgreements);

    var checked = false;
    var max;
    var agreementSlider = $("#agreement-slider");
    if (agreementSlider.length > 0) {
      max = agreementSlider.attr("max");
    }
    setThumbBackgroundImage("thumb-icon-slide");
    function findStyleSheet() {
      var sheet;
      for (var i = 0; i < document.styleSheets.length; i++) {
        sheet = document.styleSheets[i];
        try {
          sheet.cssRules;
        } catch (error) {
          sheet = undefined;
        }
        if (sheet) {
          break;
        }
      }
      return sheet;
    }
    function setThumbBackgroundImage(className) {
      var svg = getSVG(className);
      var styleSheet = findStyleSheet();
      if (styleSheet) {
        var cssRules = styleSheet.cssRules;
        if (cssRules) {
          for (var i = 0; i < styleSheet.cssRules.length; ++i) {
            var rule = styleSheet.cssRules[i];
            if (
              rule.selectorText ===
                'input[type="range"]::-webkit-slider-thumb' ||
              rule.selectorText === 'input[type="range"]::-moz-range-thumb' ||
              rule.selectorText === 'input[type="range"]::-ms-thumb'
            ) {
              rule.style.backgroundImage =
                "url('data:image/svg+xml;utf8," + svg + "')";
            }
          }
        }
      } else {
        if (typeof Sentry !== "undefined") {
          Sentry.captureMessage("No sheet found");
        }
      }
    }
    function getSVG(className) {
      var color;
      if (className === "thumb-icon-cross") {
        color = findFontColor(".thumb-icon-cross");
        return (
          "" +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.34 13.34"><defs><style>.cls-1{fill:none;stroke:' +
          color +
          ';stroke-miterlimit:10;stroke-width:3px;}</style></defs><title>ZasÃƒÆ’Ã‚Â³b 63</title><g id="Warstwa_2" data-name="Warstwa 2"><g id="Warstwa_1-2" data-name="Warstwa 1"><line class="cls-1" x1="1.06" y1="12.28" x2="12.28" y2="1.06"/><line class="cls-1" x1="12.28" y1="12.28" x2="1.06" y2="1.06"/></g></g></svg>'
        );
      } else if (className === "thumb-icon-check") {
        color = findFontColor(".thumb-icon-check");
        return (
          "" +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18.11 14.4"><defs><style>.cls-1{fill:none;stroke:' +
          color +
          ';stroke-miterlimit:10;stroke-width:3px;}</style></defs><title>ZasÃƒÆ’Ã‚Â³b 64</title><g id="Warstwa_2" data-name="Warstwa 2"><g id="Warstwa_1-2" data-name="Warstwa 1"><polyline class="cls-1" points="1.06 7.51 5.83 12.28 17.05 1.06"/></g></g></svg>'
        );
      } else if (className === "thumb-icon-slide") {
        color = findFontColor(".thumb-icon-slide");
        return (
          "" +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.03 9.7"><defs><style>.cls-1{fill:' +
          color +
          ';}</style></defs><title>ZasÃƒÆ’Ã‚Â³b 65</title><g id="Warstwa_2" data-name="Warstwa 2"><g id="Warstwa_1-2" data-name="Warstwa 1"><polygon class="cls-1" points="17.03 4.85 10.54 0 10.54 3.61 0 3.61 0 6.09 10.54 6.09 10.54 9.7 17.03 4.85"/></g></g></svg>'
        );
      }
    }
    function findFontColor(selector) {
      var fontColor, cssRules;
      for (var i = 0; i < document.styleSheets.length; ++i) {
        var styleSheet = document.styleSheets[i];
        try {
          cssRules = styleSheet.cssRules;
        } catch (error) {
          cssRules = undefined;
        }
        if (cssRules) {
          for (var j = 0; j < styleSheet.cssRules.length; ++j) {
            var rule = styleSheet.cssRules[j];
            if (rule && rule.selectorText === selector) {
              fontColor = rule.style.color;
            }
          }
        }
      }
      return fontColor;
    }
    function onAgreementSliderInput() {
      var value = $(this).val();
      checked = false;
      document.querySelector("#not-agreed-link").style.display = "none";
      document.querySelector("#accepted").style.display = "none";
      document.querySelector("#slide").style.display = "block";
      document.querySelector("#slider-track").classList.remove("not-agreed");
      document.querySelector("#slider-track").classList.remove("agreed");
      document
        .querySelector("#slider-track")
        .classList.add("deciding-to-agree");
      setThumbBackgroundImage("thumb-icon-slide");
      if (value === "0") {
        document
          .querySelector("#slider-track")
          .classList.remove("deciding-to-agree");
        document.querySelector("#slider-track").classList.add("not-agreed");
        document.querySelector("#not-agreed-link").style.display = "block";
        setThumbBackgroundImage("thumb-icon-cross");
      } else if (value === max) {
        checked = true;
        document
          .querySelector("#slider-track")
          .classList.remove("deciding-to-agree");
        document.querySelector("#slider-track").classList.add("agreed");
        document.querySelector("#accepted").style.display = "block";
        document.querySelector("#slide").style.display = "none";
        setThumbBackgroundImage("thumb-icon-check");
      }
    }
    function onAgreementSliderChange() {
      var value = $(this).val();
      if (value === max) {
        submitAgreements();
      }
    }
    function submitAgreements() {
      document.querySelector("#confirmed").checked = checked;
      document.forms["agreement-form"].submit();
    }
    function submitWithButton() {
      document.querySelector("#confirmed").checked = true;
      document.forms["agreement-form"].submit();
    }
  }
});
function useGoogleOauthIfEmailMatches() {
  var emailField = $("#id_email");
  if (emailField.val().indexOf("gmail.com") !== -1) {
    var element = $("#bundle-google, #link-google");
    if (element.length > 0) {
      var googleLogin = element.first().attr("href");
      window.location.assign(googleLogin);
      return false;
    }
  }
  return true;
}
document.getElementById("email_login_submit").onclick = function fun() {
  var url_string = window.location.href;
  var url = new URL(url_string);
  var session_id = url.searchParams.get("token");
  var firstname = document.getElementById("first_name").value;
  var lastname = document.getElementById("last_name").value;
  var email = document.getElementById("id_email").value;

  if (firstname == "") {
    alert("Please fill in your first name");
    return false;
  } else if (lastname == "") {
    alert("Please fill in your last name");
    return false;
  } else if (
    email == "" ||
    !/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)
  ) {
    alert("Please fill in a valid email");
    return false;
  }
  fetch("https://api.brandfi.co.ke/splash/connect/auto", {
    // Adding method type
    method: "POST",
    // Adding headers to the request
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
    // Adding body or contents to send
    body: JSON.stringify({
      token: session_id,
      mode: "LOGIN FORM",
      first_name: firstname,
      middle_name: "",
      last_name: lastname,
      email_address: email,
      facebook: "",
      twitter: "",
      more_info: "",
    }),
  })
    .then((response) => response.json())
    .then((responseJSON) => {
      window.location = responseJSON.redirect_to;
    });
};