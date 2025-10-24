#' Browser Class
Browser <- R6::R6Class(
  "Browser",
  private = list(
    .type = NULL,
    .remote_url = NULL,
    .prefix = 'browser',
    .meta = NULL,
    .headless = TRUE  # AGREGAR: Variable privada para almacenar headless
  ),
  active = list(
    remote_url = function() {
      private$.remote_url
    },
    prefix = function() {
      private$.prefix
    },
    id = function() {
      if (is.null(private$.meta)) return(NULL);
      private$.meta$id
    },
    meta = function(meta) {
      if (!missing(meta)) {
        private$.meta = meta
      }
    }
  ),
  public = list(
    # MODIFICAR: Agregar parámetro headless con valor por defecto TRUE
    initialize = function(type, remote_url = "http://localhost:3000", headless = TRUE) {
      if (!(type %in% c("chromium", "firefox", "webkit"))) {
        logger::log_error(paste0(c(type, "is not supported. Supported type: ", supported_browser), collapse = "\n"))
        stop()
      }

      private$.type <- type
      private$.remote_url <- remote_url
      private$.headless <- headless  # AGREGAR: Guardar el valor
      
      self$launch()
    },
    # MODIFICAR: Actualizar launch para enviar headless al servidor
    launch = function() {
      resp <- httr::POST(
        paste0(self$remote_url, "/browser/new"),
        body = list(
          type = private$.type,
          headless = private$.headless  # AGREGAR: Incluir headless en el body
        ),
        encode = "json",
        httr::accept_json()
      )
      private$.meta <- httr::content(resp)
    },
    close = fn_remote_handler,
    new_context = fn_remote_handler
  )
)
